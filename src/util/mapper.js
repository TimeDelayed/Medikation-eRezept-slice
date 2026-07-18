import {
  createFhirIdentifier,
  createFhirCodeableConcept,
  createPatientRef,
  createMedicationRef,
} from "./fhirHelpers.js";

import { CONSENT_SCOPE_SYSTEM } from "../constants/fhirConstants.js";

/**
 * Creates a FHIR Patient.
 *
 * Required:
 * - kv: Insurance identifier value (string), e.g. "A123456789"
 * - insuranceType: "GKV" | "PKV"
 * - familyName: Family name (string)
 * - givenNames: Given names as an array of strings, e.g. ["Max", "Paul"]
 *
 * Optional:
 * - gender: "male" | "female" | "other" | "unknown"
 * - birthday: FHIR date in YYYY-MM-DD format
 * - address: Array of FHIR Address objects
 * - telecom: Array of FHIR ContactPoint objects
 * - maritalStatus: FHIR CodeableConcept
 * - communication: Array of Patient.communication objects
 * - contact: Array of Patient.contact objects
 *
 * Only provided optional values are included.
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
  const identifier = createFhirIdentifier(kv, insuranceType);

  const patient = {
    resourceType: "Patient",
    identifier: [identifier],
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
    patient.address = address;
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
 * Updates an existing FHIR Patient resource.
 *
 * Expected updates, all optional:
 * - gender
 * - birthday
 * - address
 * - telecom
 * - maritalStatus
 * - communication
 * - contact
 *
 * Only provided fields overwrite the existing patient resource.
 *
 * https://hl7.org/fhir/R4/patient.html
 */
export const updateFhirPatient = (patient, updates) => {
  const updatedPatient = {
    ...patient,
  };

  if (updates.gender) {
    updatedPatient.gender = updates.gender;
  }

  if (updates.birthday) {
    updatedPatient.birthDate = updates.birthday;
  }

  if (updates.address) {
    updatedPatient.address = updates.address;
  }

  if (updates.telecom) {
    updatedPatient.telecom = updates.telecom;
  }

  if (updates.maritalStatus) {
    updatedPatient.maritalStatus = updates.maritalStatus;
  }

  if (updates.communication) {
    updatedPatient.communication = updates.communication;
  }

  if (updates.contact) {
    updatedPatient.contact = updates.contact;
  }

  return updatedPatient;
};

/**
 * Creates a minimal FHIR Consent.
 *
 * Required:
 * - patientId
 * - category
 * - decision ("permit" | "deny")
 *
 * Every newly created Consent is active.
 *
 * https://hl7.org/fhir/R4/consent.html
 */
export const createFhirConsent = ({
  patientId,
  category,
  decision,
}) => ({
  resourceType: "Consent",
  status: "active",
  scope: {
    coding: [
      {
        system: CONSENT_SCOPE_SYSTEM,
        code: "patient-privacy",
      },
    ],
  },
  category: [
    createFhirCodeableConcept(category, "consent-type"),
  ],
  patient: createPatientRef(patientId),
  dateTime: new Date().toISOString(),
  provision: {
    type: decision,
  },
});

/**
 * Creates a minimal FHIR Condition.
 *
 * Required:
 * - patientId
 * - conditionCode
 *
 * Optional:
 * - diagnosis
 *
 * https://hl7.org/fhir/R4/condition.html
 */
export const createFhirCondition = ({
  patientId,
  conditionCode,
  diagnosis,
}) => {
  return {
    resourceType: "Condition",
    subject: createPatientRef(patientId),
    code: createFhirCodeableConcept(conditionCode, "condition", diagnosis),
  };
};

/**
 * Creates a minimal FHIR Medication.
 *
 * Required:
 * - medicationCode
 *
 * Optional:
 * - medicationName
 *
 * https://hl7.org/fhir/R4/medication.html
 */
export const createFhirMedication = ({ medicationCode, medicationName }) => {
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
 *
 * Required:
 * - patientId
 * - status
 * - medicationId
 *
 * https://hl7.org/fhir/R4/medicationstatement.html
 */
export const createFhirMedicationStatement = ({
  patientId,
  status,
  medicationId,
}) => {
  return {
    resourceType: "MedicationStatement",
    status,
    medicationReference: createMedicationRef(medicationId),
    subject: createPatientRef(patientId),
  };
};

/**
 * Creates a minimal FHIR MedicationRequest.
 *
 * Required:
 * - patientId
 * - medicationId
 * - status
 * - intent
 *
 * https://hl7.org/fhir/R4/medicationrequest.html
 */
export const createFhirMedicationRequest = ({
  patientId,
  medicationId,
  status,
  intent,
}) => {
  return {
    resourceType: "MedicationRequest",
    status,
    intent,
    medicationReference: createMedicationRef(medicationId),
    subject: createPatientRef(patientId),
  };
};

/**
 * Creates a minimal FHIR Provenance.
 *
 * Required:
 * - targetReference
 * - agentReference
 *
 * https://hl7.org/fhir/R4/provenance.html
 */
export const createFhirProvenance = ({ targetReference, agentReference }) => {
  return {
    resourceType: "Provenance",
    target: [
      {
        reference: targetReference,
      },
    ],
    recorded: new Date().toISOString(),
    agent: [
      {
        who: {
          reference: agentReference,
        },
      },
    ],
  };
};

/**
 * Creates a FHIR transaction Bundle.
 *
 * Every resource is submitted using POST.
 * The transaction is atomic: either all entries succeed or none do.
 *
 * https://hl7.org/fhir/R4/bundle.html
 */
export const createFhirTransactionBundle = (resources) => {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: resources.map((resource) => ({
      resource,
      request: {
        method: "POST",
        url: resource.resourceType,
      },
    })),
  };
};
