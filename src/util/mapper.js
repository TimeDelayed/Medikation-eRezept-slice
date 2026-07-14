import { SYSTEMNAME } from "../fhirClient/fhir-client.js";

// fhir helper
export const createFhirIdentifier = (id, insuranceType) => {
  let insuranceURI = null
  if (insuranceType === "GKV") {
    insuranceURI = "http://fhir.de/sid/gkv/kvid-10"
  }
  else if (insuranceType === "PKV") {
    insuranceURI = "http://fhir.de"
  }
  else {
    throw new Error("Wrong insuranceType, please use GKV or PKV!")
  }
  return {
    type: {
      coding: [
        {
          system: "http://hl7.org",
          code: "KV",
          display: "National health plan identifier"
        }
      ]
    },
    system: insuranceURI,
    value: id,
  };
};

export const createFhirCategory = (code, namespace) => {
  let breaker = "/"
  if (SYSTEMNAME.endsWith("/")) {
    breaker = ""
  }
  return {
    coding: [{
      system: SYSTEMNAME + breaker + namespace,
      code: code
    }]
  }
}

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
  // TODO address?
}) => {
  const newIdentifier = createFhirIdentifier(kv, insuranceType);

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
export const createFhirConsent = (patientId, category, status) => {
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
 */
export const createFhirCondition = (clinicalStatus) => {
  return {
    resourceType: "Condition",
    clinicalStatus: clinicalStatus,
    code: [],
  };
};

/**
 * https://hl7.org/fhir/R4/medicationstatement.html
 */
export const createFhirMedicationStatement = () => {};

/**
 * 	https://hl7.org/fhir/R4/provenance.html
 */
export const createFhirProvenance = () => {};

/**
 * https://build.fhir.org/medicationrequest.html
 * https://hl7.org/fhir/R4/medication.html
 * need
 * https://build.fhir.org/medicationrequest.html
 * status (active | on-hold | ended | stopped | completed | cancelled | entered-in-error | draft | unknown)
 * intent (proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option (immutable))
 * medication (https://build.fhir.org/medicationrequest-definitions.html#MedicationRequest.medication)
 * subject (Individual or group for whom the medication has been requested)
 */
/**
 * extra
 * identifier (Praxis + Patient)
 * authoredOn TIMESTAMP?
 * requester (Arzt) ?
 */
export const createFhirMedication = (medication) => {
  return {};
};

/**
 * https://build.fhir.org/medicationrequest.html
 *
 * need
 * status (active | on-hold | ended | stopped | completed | cancelled | entered-in-error | draft | unknown)
 * intent (proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option (immutable))
 * medication (https://build.fhir.org/medicationrequest-definitions.html#MedicationRequest.medication)
 * subject (Individual or group for whom the medication has been requested)
 */
/**
 * extra
 * identifier (Praxis + Patient)
 * authoredOn TIMESTAMP?
 * requester (Arzt) ?
 */
export const createFhirMedicationRequest = (MedicationRequest) => {
  const newIdentifier = createFhirIdentifier(MedicationRequest.kv);
  const mediacation = build;

  return {
    resourceType: "MedicationRequest",
    identifier: [newIdentifier],
  };
};

export const createFhirTransactionBundle = () => {};