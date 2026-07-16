/**
 * FHIR server configuration
 */
export const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";

/**
 * EasyHealth namespace
 */
export const FHIR_NAMESPACE = "https://easyhealth.example/fhir";

/**
 * Namespace paths
 */
export const CODESYSTEM_PATH = "/CodeSystem";
export const NAMINGSYSTEM_PATH = "/NamingSystem";

/**
 * Identifier systems
 */
export const GKV_IDENTIFIER_SYSTEM = "http://fhir.de/sid/gkv/kvid-10";

export const PKV_IDENTIFIER_SYSTEM = `${FHIR_NAMESPACE}${NAMINGSYSTEM_PATH}/pkv-insurance-id`;

/**
 * EasyHealth CodeSystems
 */
export const CONDITION_CODESYSTEM = "condition";
export const CONSENT_CODESYSTEM = "consent-type";
export const MEDICATION_CODESYSTEM = "medication";

/**
 * Standard HL7 CodeSystems
 */
export const CONSENT_SCOPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/consentscope";

export const IDENTIFIER_TYPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v2-0203";

export const CONDITION_CLINICAL_STATUS_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/condition-clinical";
