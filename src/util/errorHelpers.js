import { OPERATION_OUTCOME_ISSUE_CODE } from "../constants/fhirConstants.js";

/**
 * Extracts diagnostics from a FHIR OperationOutcome.
 */
const getFhirErrors = (error) => {
  return error.response?.data?.issue?.map(
    (issue) =>
      issue.diagnostics ??
      issue.details?.text ??
      issue.code,
  );
};

/**
 * Sends a consistent controller error response.
 */
export const sendErrorResponse = (
  res,
  error,
  fallbackMessage = "Request failed.",
) => {
  const statusCode = error.statusCode ?? error.response?.status ?? 500;

  const fhirErrors = getFhirErrors(error);

  const diagnostics = fhirErrors?.length > 0 ? fhirErrors : [
    error.cause?.message ??
    error.message ??
    fallbackMessage,
  ];

  // add the error to the audit (better trail)
  res.req.auditError = diagnostics.join("; ");

  return res.status(statusCode).json({
    resourceType: "OperationOutcome",
    issue: diagnostics.map((diagnostic) => ({
      severity: "error",
      code:
        error.issueCode ??
        OPERATION_OUTCOME_ISSUE_CODE.PROCESSING,
      diagnostics: diagnostic,
    })),
    ...(error.consents
      ? { consents: error.consents }
      : {}),
    ...(error.visit
      ? { visit: error.visit }
      : {}),
  });
};
