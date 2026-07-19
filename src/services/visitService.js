import { VISIT_COMPLETED_ANAMNESIS } from "../constants/fhirConstants.js";
import Visit from "../db/schema/visit.schema.js";

import {
  fhirGetActiveAnamnesisConsents,
  fhirPostTransactionBundle,
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
} from "../fhirClient/fhir-client.js";
import { toArray } from "../util/commonHelpers.js";
import {
  getConsentDecision,
  getCreatedConsentId,
  createGermanFhirAddress,
  createIdentifierSearchToken,
  patientsTieBreaker } from "../util/fhirHelpers.js";

import {
  createPermittedAnamnesisBundle,
  createDeniedAnamnesisConsentBundle,
  createAnamnesisDataBundle,
  createFhirConditions,
  createFhirMedicationStatements,
  createFhirPatient,
} from "../util/mapper.js";

import {
  checkIfKvNumberExists,
  checkIfPatientHasPendingVisit,
  createLocalVisit,
  findAllVisits,
} from "../util/dbHelpers.js";


import { AppError } from "../errors/AppError.js";

const resolveAnamnesisTransaction = ({
  patientId,
  requestedDecision,
  currentConsent,
  conditions,
  medicationStatements,
}) => {
  if (requestedDecision === "permit") {
    return {
      decision: "permit",
      sendsAnamnesis: true,
      bundle: createPermittedAnamnesisBundle({
        patientId,
        currentConsent,
        conditions,
        medicationStatements,
      }),
    };
  }

  if (requestedDecision === "deny") {
    return {
      decision: "deny",
      sendsAnamnesis: false,
      bundle: createDeniedAnamnesisConsentBundle({
        patientId,
        currentConsent,
      }),
    };
  }

  if (currentConsent?.provision?.type === "permit") {
    return {
      decision: "permit",
      sendsAnamnesis: true,
      bundle: createAnamnesisDataBundle({
        conditions,
        medicationStatements,
      }),
    };
  }

  if (currentConsent?.provision?.type === "deny") {
    return {
      decision: "deny",
      sendsAnamnesis: false,
      bundle: undefined,
    };
  }

  return {
    decision: "deny",
    sendsAnamnesis: false,
    bundle: createDeniedAnamnesisConsentBundle({
      patientId,
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
 * Searches for a Patient using the insurance identifier.
 *
 * Demographic information is used as a tie-breaker because
 * the public FHIR test server does not enforce unique KV numbers.
 */
const findPatientByIdentifier = async ({
  kv,
  insuranceType,
  familyName,
  givenName,
  birthday,
  address,
  gender,
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

  return selectMatchingPatient({
    patients,
    familyName,
    givenName,
    birthday,
    address,
    gender,
  });
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
      address,
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

/**
 * Ensures that creating a new FHIR Patient would not
 * conflict with a locally stored KV number.
 */
const ensureKvCanBeUsed = async (kv) => {
  const existingVisit =
    await checkIfKvNumberExists(kv);

  if (existingVisit) {
    throw new AppError(
      409,
      "No matching Patient was found on FHIR, but the KV number already exists in the local database.",
    );
  }
};

/**
 * Finds an existing FHIR Patient or creates a new one.
 *
 * Search behaviour:
 * - With KV: identifier search plus demographic tie-breaker
 * - Without KV: demographic search
 * - No match: create a new FHIR Patient
 */
export const findOrCreatePatient = async ({
  kv,
  insuranceType,
  familyName,
  givenNames,
  birthday,
  address,
  gender,
}) => {
  const givenName = givenNames[0];

  const fhirAddress =
    createAddress(address);

  let patient;

  if (kv && insuranceType) {
    patient = await findPatientByIdentifier({
      kv,
      insuranceType,
      familyName,
      givenName,
      birthday,
      address: fhirAddress,
      gender,
    });
  } else {
    patient =
      await findPatientByDemographics({
        familyName,
        givenName,
        birthday,
        address: fhirAddress,
        gender,
      });
  }

  if (patient) {
    return patient;
  }

  await ensureKvCanBeUsed(kv);

  const newPatient = createFhirPatient({
    kv,
    insuranceType,
    familyName,
    givenNames,
    birthday,
    address: fhirAddress,
    gender,
  });

  const createdPatient =
    await fhirPostPatient(newPatient);

  if (!createdPatient?.id) {
    throw new AppError(
      502,
      "FHIR Patient response did not contain a resource id.",
    );
  }

  return createdPatient;
};
// ---------- Anamnesis Functions ----------

export const submitAnamnesis = async ({
  visitId,
  condition,
  medicationStatement,
  consent,
}) => {

  const requestedDecision = getConsentDecision(consent);
  const visit = await checkIfPatientHasPendingVisit(visitId);

  if (!visit) {
    throw new AppError(404, "Visit not found.");
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
    resolveAnamnesisTransaction({
      patientId: visit.patientFhirId,
      requestedDecision,
      currentConsent,
      conditions,
      medicationStatements,
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
    ...(transaction.sendsAnamnesis &&
    transactionResult
      ? {
        sentToFhirAt: new Date(),
      }
      : {}),
  };

  visit.visitStatus = VISIT_COMPLETED_ANAMNESIS;

  if (transactionResult?.id) {
    visit.fhirBundleRef = transactionResult.id;
  }

  await visit.save();

  return {
    visitId: visit.visitId,
    visitStatus: visit.visitStatus,
    consentDecision: transaction.decision,
    anamnesisSentToFhir:
      transaction.sendsAnamnesis &&
      Boolean(transactionResult),
    anamnesis: visit.anamnesis,
  };
};

// ---------- Visit Functions ----------
/**
 * Starts a Visit.
 *
 * The service:
 * 1. Finds or creates the FHIR Patient.
 * 2. Prevents multiple unfinished Visits.
 * 3. Creates the local Visit.
 */
export const createVisit = async (
  patientInput,
) => {
  const patient =
    await findOrCreatePatient(patientInput);

  const pendingVisit =
    await checkIfPatientHasPendingVisit(
      patient.id,
    );

  if (pendingVisit) {
    const error = new AppError(
      409,
      "Patient already has a pending Visit.",
    );

    error.visit = pendingVisit;

    throw error;
  }

  const visit = await createLocalVisit({
    kv: patientInput.kv,
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

/**
 * Returns all locally stored Visits.
 */
export const getAllVisits = async () => {
  return findAllVisits();
};
