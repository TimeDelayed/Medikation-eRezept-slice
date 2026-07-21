import {
  CONSENT_DECISION_DENY,
  CONSENT_DECISION_PERMIT,
  OPERATION_OUTCOME_ISSUE_CODE,
  VISIT_COMPLETED_ANAMNESIS,
  VISIT_FINALIZED,
} from "../constants/fhirConstants.js";
import {
  fhirGetActiveAnamnesisConsents,
  fhirPostTransactionBundle,
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
  fhirGetActiveMedicationConsents,
} from "../fhirClient/fhir-client.js";
import { toArray } from "../util/commonHelpers.js";
import {
  getConsentDecision,
  getCreatedConsentId,
  getCreatedEntities,
  createGermanFhirAddress,
  createIdentifierSearchToken,
  patientsTieBreaker } from "../util/fhirHelpers.js";

import {
  createPermittedAnamnesisBundle,
  createDeniedAnamnesisConsentBundle,
  createDataBundle,
  createFhirConditions,
  createFhirMedicationStatements,
  createFhirPatient,
  createInternalIdentifier,
  createFhirMedicationRequest,
  createPermittedMedicationRequestBundle,
  createDeniedMedicationConsentBundle,
} from "../util/mapper.js";

import {
  checkIfPatientHasPendingVisit,
  createLocalVisit,
  findAllVisits,
  findNotCompletedVisitById,
  findStartedVisitById,
} from "../util/dbHelpers.js";


import { AppError } from "../errors/AppError.js";
import { nanoid } from "nanoid";

const resolveConsentTransaction = ({
  patientId,
  requestedDecision,
  currentConsent,
  resources = [],
  user,
  createPermitBundle,
  createDenyBundle,
  createDataBundle,
})=> {
  if (requestedDecision === CONSENT_DECISION_PERMIT) {
    return {
      decision: CONSENT_DECISION_PERMIT,
      sendsData: true,
      bundle: createPermitBundle({
        patientId,
        currentConsent,
        resources,
        user,
      }),
    };
  }


  if (requestedDecision === CONSENT_DECISION_DENY) {
    return {
      decision: CONSENT_DECISION_DENY,
      sendsData: false,
      bundle: createDenyBundle({
        patientId,
        currentConsent,
        user,
      }),
    };
  }

  if (
    currentConsent?.provision?.type ===
    CONSENT_DECISION_PERMIT
  ) {
    return {
      decision: CONSENT_DECISION_PERMIT,
      sendsData: true,
      bundle: createDataBundle({
        resources,
        user,
      }),
    };
  }
  // Current consent is denied, so no new consent is created and no anamnesis data is sent to FHIR.
  if (
    currentConsent?.provision?.type ===
    CONSENT_DECISION_DENY
  ) {
    return {
      decision: CONSENT_DECISION_DENY,
      sendsData: false,
      bundle: undefined,
    };
  }

  // No current consent exists, and consent was not given in anamnesis so a new denied consent is created and no anamnesis data is sent to FHIR.
  // This is the default case when no consent decision was provided and no current consent exists.
  // It is tantamount to not signing a consent form, which is equivalent to denying consent.
  return {
    decision: CONSENT_DECISION_DENY,
    sendsData: false,
    bundle: createDenyBundle({
      patientId,
      user,
    }),
  };
};

// ---------- Patient Functions ----------
/**
 * Converts the API address into a FHIR Address.
 */
const createAddress = (address) => {
  if (
    address &&
    typeof address === "object" &&
    address.text &&
    !Array.isArray(address)
  ) {
    return createGermanFhirAddress(address);
  }

  return createGermanFhirAddress({
    text: address,
  });
};

/**
 * Returns one matching Patient from a FHIR search result.
 */
const selectMatchingPatient = ({
  patients,
  familyName,
  givenName,
  birthday,
  address,
  gender,
}) => {
  if (patients.length === 0) {
    return undefined;
  }

  if (patients.length === 1) {
    return patients[0];
  }

  return patientsTieBreaker(
    patients,
    familyName,
    givenName,
    birthday,
    address,
    gender,
  );
};


/**
 * Searches for a Patient using demographic data.
 */
const findPatientByDemographics = async ({
  familyName,
  givenName,
  birthday,
  address,
  gender,
}) => {
  const patients =
    await fhirGetPatientsByDemographics({
      familyName,
      givenName,
      birthday,
      gender,
    });

  return selectMatchingPatient({
    patients,
    familyName,
    givenName,
    birthday,
    address,
    gender,
  });
};


export const findPatientByKv = async ({
  kv,
  insuranceType,
}) => {
  const identifier =
    createIdentifierSearchToken(
      kv,
      insuranceType,
    );

  const patients =
    await fhirGetPatientByIdentifier(
      identifier,
    );

  return patients[0];
};

export const findOrCreatePatientByDemographics = async ({
  patientInternalIdentifier,
  familyName,
  givenNames,
  birthday,
  address,
  gender,
}) => {
  const givenName = givenNames[0];
  const fhirAddress = createAddress(address);

  const patient = await findPatientByDemographics({
    familyName,
    givenName,
    birthday,
    address: fhirAddress,
    gender,
  });

  if (patient) {
    return patient;
  }

  const newPatient = createFhirPatient({
    identifier: createInternalIdentifier(
      patientInternalIdentifier,
    ),
    familyName,
    givenNames,
    birthday,
    gender,
    address: fhirAddress,
  });

  const created = await fhirPostPatient(newPatient);

  if (!created?.id) {
    throw new AppError(
      502,
      "FHIR Patient response did not contain a resource id.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.PROCESSING,
      },
    );
  }

  return created;
};

// ---------- Anamnesis Functions ----------

export const submitAnamnesis = async ({
  visitId,
  condition,
  medicationStatement,
  consent,
  user,
}) => {
  const requestedDecision =
    getConsentDecision(consent);

  const visit =
    await findStartedVisitById(visitId);

  if (!visit) {
    throw new AppError(
      404,
      "Visit not found. Searched for visits with status 'started'.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.NOT_FOUND,
      },
    );
  }

  const conditionInputs = toArray(condition);
  const medicationInputs = toArray(
    medicationStatement,
  );

  const activeConsents =
    await fhirGetActiveAnamnesisConsents(
      visit.patientFhirId,
    );

  if (activeConsents.length > 1) {
    throw new AppError(
      409,
      "Multiple active anamnesis Consents exist for this patient.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.CONFLICT,
        consents: activeConsents,
      },
    );
  }

  const currentConsent = activeConsents[0];

  const conditions = createFhirConditions(
    visit.patientFhirId,
    conditionInputs,
  );

  const medicationStatements =
    createFhirMedicationStatements(
      visit.patientFhirId,
      medicationInputs,
    );

  const transaction =
    resolveConsentTransaction({
      patientId: visit.patientFhirId,
      requestedDecision,
      currentConsent,
      resources: [
        ...conditions,
        ...medicationStatements,
      ],
      user,
      createPermitBundle:
        createPermittedAnamnesisBundle,
      createDenyBundle:
        createDeniedAnamnesisConsentBundle,
      createDataBundle:
        createDataBundle,
    });

  const transactionResult = transaction.bundle
    ? await fhirPostTransactionBundle(
      transaction.bundle,
    )
    : undefined;

  const createdConsentId =
    getCreatedConsentId(transactionResult);

  visit.anamnesis = {
    preexistingConditions: conditionInputs,
    longTermMedications: medicationInputs,
    consent: {
      decision: transaction.decision,
      fhirConsentId:
        createdConsentId ?? currentConsent?.id,
      decidedAt:
        requestedDecision || !currentConsent
          ? new Date()
          : currentConsent.dateTime,
    },
    ...(transaction.sendsData &&
    transactionResult
      ? { fhirSubmittedAt: new Date() } : {}),
  };

  visit.visitStatus = VISIT_COMPLETED_ANAMNESIS;
  await visit.save();

  if (transactionResult?.id) {
    visit.fhirBundleRef = transactionResult.id;
  }

  return {
    visitId: visit.visitId,
    visitStatus: visit.visitStatus,
    consentDecision: transaction.decision,
    anamnesisSentToFhir:
      transaction.sendsData &&
      Boolean(transactionResult),
    anamnesis: visit.anamnesis,
    // only the service sees the transaction response, so the ids of
    // the created resources are handed out here for the audit trail
    fhirBundleRef: visit.fhirBundleRef,
    createdEntities: getCreatedEntities(
      transactionResult,
    ),
  };
};

export const submitMedicationRequest = async ({
  visitId,
  medicationRequest,
  consent,
  user,
}) => {
  const requestedDecision =
    getConsentDecision(consent);

  const visit =
    await findNotCompletedVisitById(
      visitId,
    );

  if (!visit) {
    throw new AppError(
      404,
      "Visit not found.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.NOT_FOUND,
      },
    );
  }

  const activeConsents =
    await fhirGetActiveMedicationConsents(
      visit.patientFhirId,
    );

  if (activeConsents.length > 1) {
    throw new AppError(
      409,
      "Multiple active medication Consents exist for this patient.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.CONFLICT,
        consents: activeConsents,
      },
    );
  }

  const currentConsent = activeConsents[0];

  const fhirMedicationRequest =
    createFhirMedicationRequest({
      patientId: visit.patientFhirId,
      ...medicationRequest,
    });

  const transaction =
    resolveConsentTransaction({
      patientId: visit.patientFhirId,
      requestedDecision,
      currentConsent,
      resources: [fhirMedicationRequest],
      user,
      createPermitBundle:
        createPermittedMedicationRequestBundle,
      createDenyBundle:
        createDeniedMedicationConsentBundle,
      createDataBundle:
        createDataBundle,
    });

  // document prescription in db bevor send to fhir
  // If transaction fails
  visit.prescription = {
    medicationRequest,
    consent: {
      decision: transaction.decision,
      fhirConsentId: currentConsent?.id,
      decidedAt:
        requestedDecision || !currentConsent
          ? new Date()
          : currentConsent.dateTime,
    },
  };

  // aufteilen von dem was wir wissen.
  const transactionResult = transaction.bundle
    ? await fhirPostTransactionBundle(
      transaction.bundle,
    )
    : undefined;

  const createdConsentId =
    getCreatedConsentId(transactionResult);

  if (createdConsentId) {
    visit.prescription.consent.fhirConsentId =
      createdConsentId;
  }

  if (
    transaction.sendsData &&
    transactionResult
  ) {
    visit.prescription.sentToFhirAt = new Date();
  }

  if (transactionResult?.id) {
    visit.fhirBundleRef =
      transactionResult.id;
  }

  visit.visitStatus = VISIT_FINALIZED;
  await visit.save();

  return {
    visitId: visit.visitId,
    visitStatus: visit.visitStatus,
    consentDecision: transaction.decision,
    medicationRequestSentToFhir:
      transaction.sendsData &&
      Boolean(transactionResult),
    prescription: visit.prescription,
    fhirBundleRef: visit.fhirBundleRef,
    createdEntities: getCreatedEntities(
      transactionResult,
    ),
  };
};

const createVisitForPatient = async ({
  patient,
  kv,
  patientInternalIdentifier,
}) => {
  const pending =
    await checkIfPatientHasPendingVisit(
      patient.id,
    );

  if (pending) {
    throw new AppError(
      409,
      "Patient already has a pending Visit.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.CONFLICT,
        visit: pending,
      },
    );
  }

  const visit = await createLocalVisit({
    kv,
    patientInternalIdentifier,
    patientFhirId: patient.id,
    visitStatus: "started",
  });

  return {
    visitId: visit.visitId,
    visitStatus: visit.visitStatus,
    patientFhirId: visit.patientFhirId,
    patient,
  };
};

export const createVisitFromKv = async ({
  kv,
  insuranceType,
}) => {
  const patient = await findPatientByKv({
    kv,
    insuranceType,
  });

  if (!patient) {
    throw new AppError(
      404,
      "Patient not found.",
      {
        issueCode:
          OPERATION_OUTCOME_ISSUE_CODE.NOT_FOUND,
      },
    );
  }

  return createVisitForPatient({
    patient,
    kv,
  });
};
export const createVisitFromDemographics =
  async (input) => {

    const patientInternalIdentifier =
      nanoid();
    const patient =
      await findOrCreatePatientByDemographics({
        ...input,
        patientInternalIdentifier,
      });

    return createVisitForPatient({
      patient,
      patientInternalIdentifier,
    });
  };

/**
 * Returns all locally stored Visits.
 */
export const getAllVisits = async () => {
  return findAllVisits();
};
