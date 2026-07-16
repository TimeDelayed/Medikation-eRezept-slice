import {
  FHIR_NAMESPACE,
  CODESYSTEM_PATH,
  GKV_IDENTIFIER_SYSTEM,
  PKV_IDENTIFIER_SYSTEM,
  IDENTIFIER_TYPE_SYSTEM,
} from "../constants/fhirConstants.js";

/**
 * Returns the identifier system URI.
 */
export const getIdentifierSystem = (insuranceType) => {
  switch (insuranceType) {
    case "GKV":
      return GKV_IDENTIFIER_SYSTEM;

    case "PKV":
      return PKV_IDENTIFIER_SYSTEM;

    default:
      throw new Error("Wrong insuranceType, please use GKV or PKV.");
  }
};

/**
 * Creates a FHIR Identifier.
 */
export const createFhirIdentifier = (value, insuranceType) => ({
  type: {
    coding: [
      {
        system: IDENTIFIER_TYPE_SYSTEM,
        code: "NIIP",
        display: "National unique individual identifier",
      },
    ],
  },
  system: getIdentifierSystem(insuranceType),
  value,
});

/**
 * Creates an identifier search token.
 *
 * Example:
 * http://fhir.de/sid/gkv/kvid-10|A123456789
 */
export const createIdentifierSearchToken = (value, insuranceType) =>
  `${getIdentifierSystem(insuranceType)}|${value}`;

/**
 * Creates a FHIR CodeableConcept.
 */
export const createFhirCodeableConcept = (code, namespace, display) => ({
  coding: [
    {
      system: `${FHIR_NAMESPACE}${CODESYSTEM_PATH}/${namespace}`,
      code,
      ...(display ? { display } : {}),
    },
  ],
});

/**
 * Creates a Patient reference.
 */
export const createPatientRef = (patientId) => ({
  reference: `Patient/${patientId}`,
});


export const patientsTieBreaker = (patients, familyName, givenName, birthday, address, gender) => {
  // Tie-breaker logic to find the best match among multiple patients
  const matchingPatients = patients.filter((patient) => {
    const patientAddress = patient.address?.[0];
    const patientBirthday = patient.birthDate;
    const patientGender = patient.gender;
    const patientFamilyName = patientName?.family;
    const patientGivenName = patientName?.given?.[0];
    return (
      patientFamilyName === familyName &&
      patientGivenName === givenName &&
      patientBirthday === birthday &&
      patientAddress === address &&
      patientGender === gender
    );
  });

  if (matchingPatients.length === 1) {
    return matchingPatients[0];
  } else if (matchingPatients.length > 1) {
    throw new Error("Multiple patients match the provided data!");
  } else {
    throw new Error("No patients match the provided data!");
  }
}

/**
 * Creates a Medication reference.
 */
export const createMedicationRef = (medicationId) => ({
  reference: `Medication/${medicationId}`,
});

/**
 * Creates a FHIR Address.
 *
 * Required:
 * - street
 * - houseNumber
 * - postalCode
 * - city
 *
 * Optional:
 * - country (default: DE)
 * - use (default: home)
 * - type (default: both)
 */
export const createFhirAddress = ({
  street,
  houseNumber,
  postalCode,
  city,
  country = "DE",
  use = "home",
  type = "both",
}) => ({
  use,
  type,
  line: [`${street} ${houseNumber}`],
  city,
  postalCode,
  country,
});