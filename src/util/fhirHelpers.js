import {
  FHIR_NAMESPACE,
  CODESYSTEM_PATH,
  GKV_IDENTIFIER_SYSTEM,
  PKV_IDENTIFIER_SYSTEM,
  IDENTIFIER_TYPE_SYSTEM,
  FHIR_BASE_URL,
  CONSENT_STATUS_INACTIVE,
} from "../constants/fhirConstants.js";
import crypto from "crypto";

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
export const createPatientRef = (patientId) => (
  createFhirReference("Patient", patientId)
);

/**
 * Creates a FHIR reference.
 *
 * Example:
 * createFhirReference("Patient", "123")
 * -> { reference: "Patient/123" }
 */
export const createFhirReference = (
  resourceType,
  resourceId,
) => {
  return {
    reference: `${resourceType}/${resourceId}`,
  };
};

/**
 * Creates a FHIR Medication reference.
 */
export const createMedicationRef = (medicationId) => {
  return createFhirReference(
    "Medication",
    medicationId,
  );
};

/**
 * Creates a FHIR Consent reference.
 */
export const createConsentRef = (consentId) => {
  return createFhirReference("Consent", consentId);
};

/**
 * Creates a FHIR transaction entry for a new resource.
 */
export const createPostEntry = (resource) => {
  return {
    fullUrl: `urn:uuid:${crypto.randomUUID()}`,
    resource,
    request: {
      method: "POST",
      url: resource.resourceType,
    },
  };
};

/**
 * Creates a FHIR transaction entry for updating
 * an existing resource.
 */
export const createPutEntry = (resource) => {
  if (!resource?.resourceType || !resource?.id) {
    throw new Error(
      "PUT transaction entries require resourceType and id.",
    );
  }

  return {
    fullUrl: `${FHIR_BASE_URL}/${resource.resourceType}/${resource.id}`,
    resource,
    request: {
      method: "PUT",
      url: `${resource.resourceType}/${resource.id}`,
    },
  };
};

/**
 * Returns an inactive copy of an existing Consent.
 *
 * The original object is not modified.
 */
export const deactivateConsent = (consent) => {
  if (!consent?.id) {
    throw new Error(
      "A persisted Consent with an id is required.",
    );
  }

  return {
    ...consent,
    status: CONSENT_STATUS_INACTIVE,
  };
};

const addressMatches = (patientAddress, address) => {
  if (!patientAddress || !address) {
    return false;
  }

  // Swagger / Query: address=Musterstraße 1, 12345 Berlin
  if (typeof address === "string") {
    return (
      patientAddress.text === address ||
      patientAddress.line?.some((line) => address.includes(line)) ||
     (patientAddress.city &&
      address.includes(patientAddress.city)) ||
      (patientAddress.postalCode && address.includes(patientAddress.postalCode))
    );
  }

  // Intern: FHIR Address object
  return (
    patientAddress.line?.[0] === address.line?.[0] &&
    patientAddress.city === address.city &&
    patientAddress.postalCode === address.postalCode &&
    patientAddress.country === address.country
  );
};

// Returns the first patient that matches the given demographics. If no patient matches, returns undefined.
// Choice was made that fhir server does not completely enforce valid patients, so there can be multiple patients with the same demographics.
// The ONLY real difference is the fhir patient id, which is not known to the user. Therefore, we just return the first patient that matches the demographics
// for this demonstrative use-case. In a real world scenario, this wouldn't be a problem since the insurance number is unique.
export const patientsTieBreaker = (
  patients,
  familyName,
  givenName,
  birthday,
  address,
  gender,
) => {
  const matchingPatients = patients.filter((patient) => {
    const name =
      patient.name?.find((n) => n.use === "official") ?? patient.name?.[0];
    const patientAddress = patient.address?.[0];

    return (
      name?.family === familyName &&
      name?.given?.includes(givenName) &&
      patient.birthDate === birthday &&
      patient.gender === gender &&
      addressMatches(patientAddress, address)
    );
  });

  return matchingPatients[0];
};

/**
 * Creates a minimal FHIR Address.
 *
 * Required:
 * - text
 *
 * Optional:
 * - country (default: DE)
 * - use (default: home)
 * - type (default: both)
 *
 * https://hl7.org/fhir/R4/datatypes.html#Address
 */
export const createGermanFhirAddress = ({
  street,
  houseNumber,
  postalCode,
  city,
  text,
  country = "DE",
  use = "home",
  type = "both",
}) => ({
  use,
  ...(street && houseNumber
    ? { line: [`${street} ${houseNumber}`] }
    : {}),
  city,
  postalCode,
  type,
  text,
  country,
});

/**
 * Creates a FHIR ContactPoint (telecom).
 *
 * Parameters:
 * - system: phone | fax | email | pager | url | sms | other
 * - value: Contact value
 * - use: home | work | temp | old | mobile (optional)
 * - rank: Preference order (optional)
 *
 * https://hl7.org/fhir/R4/datatypes.html#ContactPoint
 */
export const createFhirTelecom = ({ system, value, use, rank }) => {
  const telecom = {
    system,
    value,
  };

  if (use) {
    telecom.use = use;
  }

  if (rank) {
    telecom.rank = rank;
  }

  return telecom;
};

export const getConsentDecision = (consent) => {
  if (typeof consent === "string") {
    return consent;
  }

  return consent?.decision;
};

export const getCreatedConsentId = (transactionResult) => {
  const location = transactionResult?.entry?.find((entry) =>
    entry.response?.location?.startsWith("Consent/"),
  )?.response?.location;

  return location?.split("/")[1];
};
