import {
  ANAMNESIS_CONSENT_CATEGORY,
  ANAMNESIS_CONSENT_DISPLAY,
  CONSENT_CODESYSTEM_NAME,
  VALID_CONSENT_DECISIONS,
  CONSENT_SCOPE_SYSTEM,
  STATUS_ACTIVE,
  CONSENT_DECISION_PERMIT,
  CONSENT_DECISION_DENY,
  FHIR_NAMESPACE,
  USERS_NAMESPACE,
  IDENTIFIER_TYPE_SYSTEM,
  IDENTIFIER_INTERNAL_SYSTEM,
  MEDICATION_CONSENT_CATEGORY,
  MEDICATION_CONSENT_DISPLAY,
  MEDICATION_REQUEST_INTENT_ORDER,
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
  identifier,
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
    resourceType:"Patient",
    identifier: Array.isArray(identifier)
      ? identifier
      : [identifier],
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

export const createInternalIdentifier = (
  value,
) => ({
  type: {
    coding: [
      {
        system: IDENTIFIER_TYPE_SYSTEM,
        code: "PI",
        display:
          "Practice internal identifier",
      },
    ],
  },
  system:
    IDENTIFIER_INTERNAL_SYSTEM,
  value,
});

export const createFhirConsent = ({
  patientId,
  decision,
  categoryCode,
  categoryDisplay,
}) => {
  if (!VALID_CONSENT_DECISIONS.includes(decision)) {
    throw new Error(
      "Consent decision must be \"permit\" or \"deny\".",
    );
  }

  return {
    resourceType: "Consent",
    status: STATUS_ACTIVE,
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
        categoryCode,
        CONSENT_CODESYSTEM_NAME,
        categoryDisplay,
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
 * Creates a minimal FHIR Consent for sharing
 * data via FHIR.
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
  return createFhirConsent({
    patientId,
    decision,
    categoryCode: ANAMNESIS_CONSENT_CATEGORY,
    categoryDisplay: ANAMNESIS_CONSENT_DISPLAY,
  });
};

export const createFhirMedicationConsent = ({
  patientId,
  decision,
}) =>
  createFhirConsent({
    patientId,
    decision,
    categoryCode: MEDICATION_CONSENT_CATEGORY,
    categoryDisplay: MEDICATION_CONSENT_DISPLAY,
  });

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
  code,
  display,
}) => ({
  resourceType: "MedicationStatement",
  status: STATUS_ACTIVE,
  medicationCodeableConcept: createFhirCodeableConcept(
    code,
    "medication",
    display,
  ),
  subject: createPatientRef(patientId),
});

/**
 * Creates Fhir MedicationRequest
 */
// just as the medicationStatement
export const createFhirMedicationRequest = ({
  patientId,
  code,
  display,
}) => ({
  resourceType: "MedicationRequest",
  status: STATUS_ACTIVE,
  intent: MEDICATION_REQUEST_INTENT_ORDER,
  medicationCodeableConcept: createFhirCodeableConcept(
    code,
    "medication",
    display,
  ),
  subject: createPatientRef(patientId),
});

/**
 * Creates a generic FHIR transaction Bundle.
 *
 * A Provenance resource targeting every submitted resource
 * is automatically added to the transaction.
 */
export const createFhirTransactionBundle = (
  resources,
  user,
) => {
  const entries = resources.map(createPostEntry);

  const provenance =
    createFhirProvenanceFromEntries({
      entries,
      user,
    });

  entries.push(createPostEntry(provenance));

  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: entries,
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
 * 4. Creates a Provenance for all written resources.
 */
export const createConsentReplacementBundle = ({
  currentConsent,
  newConsent,
  resources = [],
  user,
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

  const provenance =
    createFhirProvenanceFromEntries({
      entries,
      user,
    });

  entries.push(createPostEntry(provenance));

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
 * Only Consent and Provenance resources are written to FHIR.
 */
export const createDeniedAnamnesisConsentBundle = ({
  patientId,
  currentConsent,
  user,
}) => {
  const deniedConsent =
    createFhirAnamnesisConsent({
      patientId,
      decision: CONSENT_DECISION_DENY,
    });

  return createConsentReplacementBundle({
    currentConsent,
    newConsent: deniedConsent,
    user,
  });
};

export const createDeniedMedicationConsentBundle = ({
  patientId,
  currentConsent,
  user,
}) => {
  const deniedConsent =
    createFhirMedicationConsent({
      patientId,
      decision: CONSENT_DECISION_DENY,
    });
  return createConsentReplacementBundle({
    currentConsent,
    newConsent: deniedConsent,
    user,
  });
};

/**
 * Creates the FHIR transaction for a permitted anamnesis.
 *
 * The previous active Consent is deactivated.
 * A new active permit Consent is created together with
 * the Conditions, MedicationStatements and Provenance.
 */
export const createPermittedAnamnesisBundle = ({
  patientId,
  currentConsent,
  resources = [],
  user,
}) => {
  const permitConsent =
    createFhirAnamnesisConsent({
      patientId,
      decision: CONSENT_DECISION_PERMIT,
    });

  return createConsentReplacementBundle({
    currentConsent,
    newConsent: permitConsent,
    resources,
    user,
  });
};

export const createPermittedMedicationRequestBundle = ({
  patientId,
  currentConsent,
  resources = [],
  user,
}) => {
  const permitConsent =
    createFhirMedicationConsent({
      patientId,
      decision: CONSENT_DECISION_PERMIT,
    });

  return createConsentReplacementBundle({
    currentConsent,
    newConsent: permitConsent,
    resources,
    user,
  });
};

/**
 * Creates a FHIR Provenance for an EasyHealth transaction.
 *
 * Required:
 * - targetReferences
 * - user.sub
 * - user.name
 */
export const createFhirProvenanceForEasyHealth = ({
  targetReferences,
  user,
}) => {
  if (
    !Array.isArray(targetReferences) ||
    targetReferences.length === 0
  ) {
    throw new Error(
      "At least one Provenance target is required.",
    );
  }

  if (!user?.sub || !user?.name) {
    throw new Error(
      "Authenticated user is required for Provenance.",
    );
  }

  return {
    resourceType: "Provenance",
    target: targetReferences.map((reference) => ({
      reference,
    })),
    recorded: new Date().toISOString(),
    agent: [
      {
        type: {
          text: "author",
        },
        who: {
          identifier: {
            system: `${FHIR_NAMESPACE}${USERS_NAMESPACE}`,
            value: user.sub,
          },
          display: user.name,
        },
        onBehalfOf: {
          reference: "Organization/easyhealth",
          display: "EasyHealth",
        },
      },
    ],
  };
};

/**
 * Creates Provenance for all resources already contained
 * in a transaction.
 *
 * The Provenance itself is deliberately not included
 * as one of its own targets.
 */
export const createFhirProvenanceFromEntries = ({
  entries,
  user,
}) => {
  const targetReferences = entries
    .map((entry) => entry.fullUrl)
    .filter(Boolean);

  return createFhirProvenanceForEasyHealth({
    targetReferences,
    user,
  });
};


/**
 * Creates a FHIR transaction for anamnesis resources
 * when an existing active permit Consent remains valid.
 *
 * The existing Consent is not posted again.
 * Provenance is added for the newly submitted resources.
 */
export const createDataBundle = ({
  resources = [],
  user,
}) => {
  return createFhirTransactionBundle(
    resources,
    user,
  );
};
