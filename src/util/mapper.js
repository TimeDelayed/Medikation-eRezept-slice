import { SYSTEMNAME } from "../fhirClient/fhir-client.js";

// fhir helper
export const createFhirIdentifier = (id, insuranceType) => {
  let insuranceURI = null;
  if (insuranceType === "GKV") {
    insuranceURI = "http://fhir.de/sid/gkv/kvid-10";
  } else if (insuranceType === "PKV") {
    insuranceURI = "http://fhir.de";
  } else {
    throw new Error("Wrong insuranceType, please use GKV or PKV!");
  }
  return {
    type: {
      coding: [
        {
          system: "http://hl7.org",
          code: "KV",
          display: "National health plan identifier",
        },
      ],
    },
    system: insuranceURI,
    value: id,
  };
};

export const createFhirCategory = (code, namespace) => {
  let breaker = "/";
  if (SYSTEMNAME.endsWith("/")) {
    breaker = "";
  }
  return {
    coding: [
      {
        system: SYSTEMNAME + breaker + namespace,
        code: code,
      },
    ],
  };
};

// https://coreui.io/answers/how-to-generate-uuid-in-javascript/
const createNewId = () => {
  const uuid = crypto.randomUUID();
  return uuid;
};

const createPatientRef = (id) => ({
  reference: `Patient/${id}`,
});

/**
 * https://hl7.org/fhir/R4/patient.html
 */
export const createFhirPatient = ({
  kv,
  insuranceType,
  familyName,
  givenNames,
  gender,
  birthday,
  // TODO address?????????????????
}) => {
  const newIdentifier = createFhirIdentifier({ kv, insuranceType });

  return {
    resourceType: "Patient",
    identifier: [newIdentifier],
    name: [
      {
        family: familyName,
        given: givenNames,
      },
    ],
    gender: gender,
    birthDate: birthday,
  };
};

/**
 * https://hl7.org/fhir/R4/patient.html
 */
export const createFhirConsent = ({ patientId, category, status }) => {
  return {
    resourceType: "Consent",
    status: status,
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
        },
      ],
    },
    category: [createFhirCategory(category, "consent-type")],
    patient: {
      reference: createPatientRef(patientId),
    },
    dateTime: new Date().toISOString(),
  };
};

/**
 * https://hl7.org/fhir/R4/condition.html
 *
 * Minimal for our use case:
 * - subject
 * - code
 */
export const createFhirCondition = ({
  patientId,
  conditionCode,
  diagnosis,
}) => {
  return {
    resourceType: "Condition",
    subject: createPatientRef(patientId),
    code: {
      coding: [
        {
          system: `${SYSTEMNAME}/CodeSystem/condition`,
          code: conditionCode,
          display: diagnosis,
        },
      ],
    },
  };
};

/**
 * https://hl7.org/fhir/R4/medicationstatement.html
 *
 * Required:
 * - status
 * - medication[x]
 * - subject
 */
export const createFhirMedicationStatement = ({
  patientId,
  status,
  medicationId,
}) => {
  return {
    resourceType: "MedicationStatement",
    status,
    medicationReference: {
      reference: `Medication/${medicationId}`,
    },
    subject: createPatientRef(patientId),
  };
};

/**
 * https://hl7.org/fhir/R4/provenance.html
 *
 * Required:
 * - target
 * - recorded
 * - agent
 */
export const createFhirProvenance = ({
  targetReference,
  agentReference,
}) => {
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
 * https://hl7.org/fhir/R4/medication.html
 *
 * Medication itself has no mandatory content fields,
 * but code is required for it to be useful.
 */
export const createFhirMedication = ({
  medicationCode,
  medicationName,
}) => {
  return {
    resourceType: "Medication",
    code: {
      coding: [
        {
          system: `${SYSTEMNAME}/CodeSystem/medication`,
          code: medicationCode,
          display: medicationName,
        },
      ],
    },
  };
};

/**
 * https://hl7.org/fhir/R4/medicationrequest.html
 *
 * Required:
 * - status
 * - intent
 * - medication[x]
 * - subject
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
    medicationReference: {
      reference: `Medication/${medicationId}`,
    },
    subject: createPatientRef(patientId),
  };
};

/**
 * https://hl7.org/fhir/R4/bundle.html
 *
 * Minimal transaction bundle.
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
