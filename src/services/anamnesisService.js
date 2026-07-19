import { VISIT_COMPLETED_ANAMNESIS } from "../constants/fhirConstants.js";
import Visit from "../db/schema/visit.schema.js";

import {
  fhirGetActiveAnamnesisConsents,
  fhirPostTransactionBundle,
} from "../fhirClient/fhir-client.js";
import { toArray } from "../util/commonHelpers.js";
import { getConsentDecision, getCreatedConsentId } from "../util/fhirHelpers.js";

import {
  createPermittedAnamnesisBundle,
  createDeniedAnamnesisConsentBundle,
  createAnamnesisDataBundle,
  createFhirConditions,
  createFhirMedicationStatements,
} from "../util/mapper.js";


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

export const submitAnamnesis = async ({
  visitId,
  condition,
  medicationStatement,
  consent,
}) => {
  const visit = await Visit.findOne({ visitId });

  if (!visit) {
    const error = new Error("Visit not found.");
    error.statusCode = 404;
    throw error;
  }

  const requestedDecision = getConsentDecision(consent);

  if (
    requestedDecision &&
    !["permit", "deny"].includes(requestedDecision)
  ) {
    const error = new Error(
      "Consent decision must be \"permit\" or \"deny\".",
    );
    error.statusCode = 400;
    throw error;
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
    const error = new Error(
      "Multiple active anamnesis Consents exist for this patient.",
    );
    error.statusCode = 409;
    error.consents = activeConsents;
    throw error;
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
