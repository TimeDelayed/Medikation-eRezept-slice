// ---------- FHIR server ----------

export const FHIR_BASE_URL =
  "https://hapi.fhir.org/baseR4";

// ---------- EasyHealth namespaces ----------

export const FHIR_NAMESPACE =
  "https://easyhealth.example/fhir";

export const CODESYSTEM_PATH = "/CodeSystem";
export const NAMINGSYSTEM_PATH = "/NamingSystem";
export const USERS_NAMESPACE = "/users";

// ---------- Identifier systems ----------

export const GKV_IDENTIFIER_SYSTEM =
  "http://fhir.de/sid/gkv/kvid-10";

export const PKV_IDENTIFIER_SYSTEM =
  `${FHIR_NAMESPACE}${NAMINGSYSTEM_PATH}/pkv-insurance-id`;

export const IDENTIFIER_TYPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v2-0203";

export const INSURANCE_TYPE_GKV = "GKV";
export const INSURANCE_TYPE_PKV = "PKV";

export const VALID_INSURANCE_TYPES = [INSURANCE_TYPE_GKV, INSURANCE_TYPE_PKV];

export const IDENTIFIER_INTERNAL_SYSTEM =
  `${FHIR_NAMESPACE}/identifier/internal`;

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

export const PATIENT_GENDER_MALE = "male";
export const PATIENT_GENDER_FEMALE = "female";
export const PATIENT_GENDER_OTHER = "other";
export const PATIENT_GENDER_UNKNOWN = "unknown";

export const VALID_GENDERS = [
  PATIENT_GENDER_MALE,
  PATIENT_GENDER_FEMALE,
  PATIENT_GENDER_OTHER,
  PATIENT_GENDER_UNKNOWN,
];

// ---------- Medication Request Consent ----------
export const MEDICATION_CONSENT_CATEGORY = "medication-request";
export const MEDICATION_CONSENT_DISPLAY =
  "Medication request sharing consent";
export const MEDICATION_CONSENT_CATEGORY_TOKEN =
  `${CONSENT_CODESYSTEM}|${MEDICATION_CONSENT_CATEGORY}`;
export const MEDICATION_REQUEST_INTENT_ORDER = "order";

// ---------- Statuses ----------

export const STATUS_ACTIVE = "active";
export const STATUS_INACTIVE = "inactive";


// ---------- Consent decisions ----------

export const CONSENT_DECISION_PERMIT = "permit";
export const CONSENT_DECISION_DENY = "deny";

export const VALID_CONSENT_DECISIONS = [
  CONSENT_DECISION_PERMIT,
  CONSENT_DECISION_DENY,
];

// ---------- Visit status ----------
export const VISIT_STARTED_STATUS = "started";
export const VISIT_COMPLETED_ANAMNESIS = "amnesisIsCompleted";
export const VISIT_FINALIZED = "completed";

export const VISIT_STATUSES = [
  VISIT_STARTED_STATUS,
  VISIT_COMPLETED_ANAMNESIS,
  VISIT_FINALIZED,
];

// ---------- Issue Codes ----------
// Issue Codes: https://build.fhir.org/valueset-issue-type.html
export const OPERATION_OUTCOME_ISSUE_CODE = Object.freeze({
  INVALID: "invalid",
  STRUCTURE: "structure",
  REQUIRED: "required",
  VALUE: "value",
  INVARIANT: "invariant",
  SECURITY: "security",
  LOGIN: "login",
  UNKNOWN: "unknown",
  EXPIRED: "expired",
  CONFLICT: "conflict",
  TOO_LONG: "too-long",
  CODE_INVALID: "code-invalid",
  NOT_FOUND: "not-found",
  DUPLICATE: "duplicate",
  FORBIDDEN: "forbidden",
  PROCESSING: "processing",
  EXCEPTION: "exception",
  NOT_SUPPORTED: "not-supported",
});
