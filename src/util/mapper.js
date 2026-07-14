import { SYSTEMNAME } from "../fhirClient/fhir-client.js";

// fhir helper
export const createFhirIdentifier = (id) => {
  return {
    system: SYSTEMNAME,
    value: id,
  };
};

// https://coreui.io/answers/how-to-generate-uuid-in-javascript/
const createNewId = () => {
  const uuid = crypto.randomUUID();
  return uuid;
};
const createPatientRef = (id) => {
  reference: `patient/${id}`;
};

/**
 * https://hl7.org/fhir/R4/patient.html
 */
export const createFhirPatient = ({
  kv,
  familyName,
  givenNames,
  gender,
  birthday,
}) => {
  const newIdentifier = createFhirIdentifier(kv);

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
export const createFhirConsent = (patientId, category) => {
  return {
    resourceType: "Consent",
    status: "active",
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: SYSTEMNAME,
            code: category,
          },
        ],
      },
    ],
    patient: {
      reference: createPatientRef(patientId),
    },
    dateTime: new Date().toISOString(),
  };
};

/**
 * https://hl7.org/fhir/R4/condition.html
 */
export const createFhirCondition = () => {};

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
