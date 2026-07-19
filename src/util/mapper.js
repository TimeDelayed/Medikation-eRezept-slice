import {
  ANAMNESIS_CONSENT_CATEGORY,
  ANAMNESIS_CONSENT_DISPLAY,
  CONSENT_CODESYSTEM_NAME,
  VALID_CONSENT_DECISIONS,
  CONSENT_SCOPE_SYSTEM,
  CONSENT_STATUS_ACTIVE,
  CONSENT_DECISION_PERMIT,
  CONSENT_DECISION_DENY,
} from "../constants/fhirConstants.js";

import {
  createFhirIdentifier,
  createFhirCodeableConcept,
  createPatientRef,
  createPostEntry,
  createPutEntry,
  deactivateConsent,
} from "./fhirHelpers.js";

/**
 * Creates a FHIR Patient.
 *
 * Required:
 * - kv
 * - insuranceType
 * - familyName
 * - givenNames
 *
 * Optional:
 * - gender
 * - birthday
 * - address
 * - telecom
 * - maritalStatus
 * - communication
 * - contact
 *
 * https://hl7.org/fhir/R4/patient.html
 */
export const createFhirPatient = ({
  kv,
  insuranceType,
  familyName,
  givenNames,
  gender,
  birthday,
  address,
  telecom,
  maritalStatus,
  communication,
  contact,
}) => {
  const patient = {
    resourceType: "Patient",
    identifier: [
      createFhirIdentifier(kv, insuranceType),
    ],
    name: [
      {
        use: "official",
        family: familyName,
        given: givenNames,
      },
    ],
  };

  if (gender) {
    patient.gender = gender;
  }
  if (birthday) {
    patient.birthDate = birthday;
  }
  if (address) {
    patient.address = Array.isArray(address)
      ? address
      : [address];
  }
  if (telecom) {
    patient.telecom = telecom;
  }
  if (maritalStatus) {
    patient.maritalStatus = maritalStatus;
  }
  if (communication) {
    patient.communication = communication;
  }
  if (contact) {
    patient.contact = contact;
  }

  return patient;
};

/**
 * Creates a minimal FHIR Consent for sharing
 * anamnesis data via FHIR.
 *
 * Required:
 * - patientId
 * - decision: "permit" | "deny"
 *
 * Every newly created Consent represents the currently
 * applicable decision and therefore has status "active".
 *
 * https://hl7.org/fhir/R4/consent.html
 */
export const createFhirAnamnesisConsent = ({
  patientId,
  decision,
}) => {
  if (!VALID_CONSENT_DECISIONS.includes(decision)) {
    throw new Error(
      "Consent decision must be \"permit\" or \"deny\".",
    );
  }

  return {
    resourceType: "Consent",
    status: CONSENT_STATUS_ACTIVE,
    scope: {
      coding: [
        {
          system: CONSENT_SCOPE_SYSTEM,
          code: "patient-privacy",
        },
      ],
    },
    category: [
      createFhirCodeableConcept(
        ANAMNESIS_CONSENT_CATEGORY,
        CONSENT_CODESYSTEM_NAME,
        ANAMNESIS_CONSENT_DISPLAY,
      ),
    ],
    patient: createPatientRef(patientId),
    dateTime: new Date().toISOString(),
    provision: {
      type: decision,
    },
  };
};

/**
 * Creates FHIR Condition resources for a patient.
 */
export const createFhirConditions = (
  patientId,
  conditions = [],
) => {
  return conditions.map((condition) =>
    createFhirCondition({
      patientId,
      ...condition,
    }),
  );
};

/**
 * Creates FHIR MedicationStatement resources for a patient.
 */
export const createFhirMedicationStatements = (
  patientId,
  medicationStatements = [],
) => {
  return medicationStatements.map(
    (medicationStatement) =>
      createFhirMedicationStatement({
        patientId,
        ...medicationStatement,
      }),
  );
};

/**
 * Creates a minimal FHIR Condition.
 */
export const createFhirCondition = ({
  patientId,
  code,
  display,
}) => ({
  resourceType: "Condition",
  subject: createPatientRef(patientId),
  code: createFhirCodeableConcept(
    code,
    "condition",
    display,
  ),
});

/**
 * Creates a minimal FHIR Medication.
 */
export const createFhirMedication = ({
  medicationCode,
  medicationName,
}) => {
  return {
    resourceType: "Medication",
    code: createFhirCodeableConcept(
      medicationCode,
      "medication",
      medicationName,
    ),
  };
};

/**
 * Creates a minimal FHIR MedicationStatement.
 */
export const createFhirMedicationStatement = ({
  patientId,
  status = "active",
  code,
  display,
}) => ({
  resourceType: "MedicationStatement",
  status,
  medicationCodeableConcept: createFhirCodeableConcept(
    code,
    "medication",
    display,
  ),
  subject: createPatientRef(patientId),
});

/**
 * Creates a generic FHIR transaction Bundle.
 */
export const createFhirTransactionBundle = (
  resources,
) => {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: resources.map(createPostEntry),
  };
};

/**
 * Creates a transaction Bundle that replaces
 * the currently active anamnesis Consent.
 *
 * The transaction:
 * 1. Sets the existing active Consent to inactive, if present.
 * 2. Creates a new active Consent with permit or deny.
 * 3. Optionally creates additional FHIR resources.
 *
 * Use with an empty resources array for a denied Consent
 * that must be stored without sharing anamnesis data.
 */
export const createConsentReplacementBundle = ({
  currentConsent,
  newConsent,
  resources = [],
}) => {
  const entries = [];

  if (currentConsent) {
    const inactiveConsent =
      deactivateConsent(currentConsent);

    entries.push(createPutEntry(inactiveConsent));
  }

  entries.push(createPostEntry(newConsent));

  for (const resource of resources) {
    entries.push(createPostEntry(resource));
  }

  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: entries,
  };
};

/**
 * Creates the transaction used when the patient
 * denies sharing anamnesis data.
 *
 * Only Consent resources are written to FHIR.
 */
export const createDeniedAnamnesisConsentBundle = ({
  patientId,
  currentConsent,
}) => {
  const deniedConsent =
    createFhirAnamnesisConsent({
      patientId,
      decision: CONSENT_DECISION_DENY,
    });

  return createConsentReplacementBundle({
    currentConsent,
    newConsent: deniedConsent,
  });
};

/**
 * Creates the FHIR transaction for a permitted anamnesis.
 *
 * The previous active Consent is deactivated.
 * A new active permit Consent is created together with
 * the Conditions and MedicationStatements.
 */
export const createPermittedAnamnesisBundle = ({
  patientId,
  currentConsent,
  conditions = [],
  medicationStatements = [],
}) => {
  const permitConsent =
    createFhirAnamnesisConsent({
      patientId,
      decision: CONSENT_DECISION_PERMIT,
    });

  return createConsentReplacementBundle({
    currentConsent,
    newConsent: permitConsent,
    resources: [
      ...conditions,
      ...medicationStatements,
    ],
  });
};

/**
 * Creates a FHIR transaction for anamnesis resources
 * when an existing active permit Consent remains valid.
 *
 * The existing Consent is not posted again.
 */
export const createAnamnesisDataBundle = ({
  conditions = [],
  medicationStatements = [],
}) => {
  return createFhirTransactionBundle([
    ...conditions,
    ...medicationStatements,
  ]);
};
