import { AppError } from "../errors/AppError.js";
import { VALID_INSURANCE_TYPES, VALID_GENDERS, VALID_CONSENT_DECISIONS, OPERATION_OUTCOME_ISSUE_CODE } from "../constants/fhirConstants.js";

const isNonEmptyString = (value) => {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
};

const isValidFhirDate = (value) => {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const isValidAddress = (address) => {
  if (isNonEmptyString(address)) {
    return true;
  }

  return (
    address &&
    typeof address === "object" &&
    isNonEmptyString(address.text)
  );
};

/**
 * Validates the request body used to start a Visit via demographics search or create.
 */
export const validateCreateVisitDemographicsInput = (body) => {
  if (!body || typeof body !== "object") {
    throw new AppError(
      400,
      "A JSON request body is required.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  const {
    familyName,
    givenNames,
    birthday,
    address,
    gender,
  } = body;

  const missingFields = [];

  if (!isNonEmptyString(familyName)) {
    missingFields.push("familyName");
  }

  if (
    !Array.isArray(givenNames) ||
    givenNames.length === 0 ||
    givenNames.some(
      (name) => !isNonEmptyString(name),
    )
  ) {
    missingFields.push("givenNames");
  }

  if (!birthday) {
    missingFields.push("birthday");
  }

  if (!address) {
    missingFields.push("address");
  }

  if (!gender) {
    missingFields.push("gender");
  }

  if (missingFields.length > 0) {
    throw new AppError(
      400,
      `Missing or invalid required fields: ${missingFields.join(", ")}.`,
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  if (!VALID_GENDERS.includes(gender)) {
    throw new AppError(
      400,
      "gender must be male, female, other or unknown.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }

  if (!isValidFhirDate(birthday)) {
    throw new AppError(
      400,
      "birthday must use the FHIR date format YYYY-MM-DD.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }

  if (!isValidAddress(address)) {
    throw new AppError(
      400,
      "address must either be a non-empty string or an object containing text.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }
};

/**
 * Validates the request body used to start a Visit via kv search.
 */
export const validateCreateVisitKVInput = (body) => {
  if (!body || typeof body !== "object") {
    throw new AppError(
      400,
      "A JSON request body is required.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  const {
    kv,
    insuranceType,
  } = body;

  const missingFields = [];

  if (!isNonEmptyString(kv)) {
    missingFields.push("kv");
  }

  if (!insuranceType) {
    missingFields.push("insuranceType");
  }

  if (missingFields.length > 0) {
    throw new AppError(
      400,
      `Missing or invalid required fields: ${missingFields.join(", ")}.`,
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  if (
    !VALID_INSURANCE_TYPES.includes(
      insuranceType,
    )
  ) {
    throw new AppError(
      400,
      "insuranceType must be GKV or PKV.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }
};

/**
 * Validates the anamnesis request.
 */
export const validateSubmitAnamnesisInput = ({
  visitId,
  body,
}) => {
  if (!isNonEmptyString(visitId)) {
    throw new AppError(
      400,
      "Missing required path parameter: visitId.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  if (!body || typeof body !== "object") {
    throw new AppError(
      400,
      "A JSON request body is required.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  const {
    condition,
    medicationStatement,
    consent,
  } = body;

  const consentDecision =
    typeof consent === "string"
      ? consent
      : consent?.decision;

  if (
    consentDecision &&
    !VALID_CONSENT_DECISIONS.includes(
      consentDecision,
    )
  ) {
    throw new AppError(
      400,
      "Consent decision must be \"permit\" or \"deny\".",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }

  if (
    condition !== undefined &&
    !Array.isArray(condition) &&
    typeof condition !== "object"
  ) {
    throw new AppError(
      400,
      "condition must be an object or an array.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }

  if (
    medicationStatement !== undefined &&
    !Array.isArray(medicationStatement) &&
    typeof medicationStatement !== "object"
  ) {
    throw new AppError(
      400,
      "medicationStatement must be an object or an array.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }
};

export const validateMedicationRequestInput = ({
  visitId,
  body,
}) => {
  if (!isNonEmptyString(visitId)) {
    throw new AppError(
      400,
      "Missing required path parameter: visitId.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  if (!body || typeof body !== "object") {
    throw new AppError(
      400,
      "A JSON request body is required.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.REQUIRED,
      },
    );
  }

  const { medicationRequest, consent } = body;

  const consentDecision =
    typeof consent === "string"
      ? consent
      : consent?.decision;

  if (
    consentDecision &&
    !VALID_CONSENT_DECISIONS.includes(
      consentDecision,
    )
  ) {
    throw new AppError(
      400,
      "Consent decision must be \"permit\" or \"deny\".",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }

  if (
    medicationRequest !== undefined &&
    !Array.isArray(medicationRequest) &&
    typeof medicationRequest !== "object"
  ) {
    throw new AppError(
      400,
      "medicationRequest must be an object or an array.",
      {
        issueCode: OPERATION_OUTCOME_ISSUE_CODE.VALUE,
      },
    );
  }
};
