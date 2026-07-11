import {SYSTEMNAME} from "../fhirClient/fhir-client.js";

export const createFhirPatient = (patientData) => {
  return {
    resourceType: "Patient",
    identifier: [
      {
        system: SYSTEMNAME,
        value: patientData.kv
      }
    ],
    name: [
      {
        family: patientData.familyName,
        given: patientData.givenNames
      }
    ],
    gender: patientData.gender,
    birthDate: patientData.birthDate
  };
};
