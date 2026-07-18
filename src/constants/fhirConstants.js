// ---------- FHIR server ----------

export const FHIR_BASE_URL =
  "https://hapi.fhir.org/baseR4";

// ---------- EasyHealth namespaces ----------

export const FHIR_NAMESPACE =
  "https://easyhealth.example/fhir";

export const CODESYSTEM_PATH = "/CodeSystem";
export const NAMINGSYSTEM_PATH = "/NamingSystem";

// ---------- Identifier systems ----------

export const GKV_IDENTIFIER_SYSTEM =
  "http://fhir.de/sid/gkv/kvid-10";

export const PKV_IDENTIFIER_SYSTEM =
  `${FHIR_NAMESPACE}${NAMINGSYSTEM_PATH}/pkv-insurance-id`;

export const IDENTIFIER_TYPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v2-0203";

// ---------- Consent systems ----------

export const CONSENT_SCOPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/consentscope";

export const CONSENT_CODESYSTEM_NAME =
  "consent-type";

export const CONSENT_CODESYSTEM =
  `${FHIR_NAMESPACE}${CODESYSTEM_PATH}/${CONSENT_CODESYSTEM_NAME}`;

// ---------- Anamnesis consent ----------

export const ANAMNESIS_CONSENT_CATEGORY =
  "anamnesis-data-sharing";

export const ANAMNESIS_CONSENT_DISPLAY =
  "Sharing anamnesis data via FHIR";

export const ANAMNESIS_CONSENT_CATEGORY_TOKEN =
  `${CONSENT_CODESYSTEM}|${ANAMNESIS_CONSENT_CATEGORY}`;

// ---------- Consent status ----------

export const CONSENT_STATUS_ACTIVE = "active";
export const CONSENT_STATUS_INACTIVE = "inactive";

// ---------- Consent decisions ----------

export const CONSENT_DECISION_PERMIT = "permit";
export const CONSENT_DECISION_DENY = "deny";

export const CONSENT_DECISIONS = [
  CONSENT_DECISION_PERMIT,
  CONSENT_DECISION_DENY,
];
