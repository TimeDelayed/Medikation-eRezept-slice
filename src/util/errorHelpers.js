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
  const statusCode =
    error.statusCode ??
    error.response?.status ??
    500;

  const fhirErrors = getFhirErrors(error);

  return res.status(statusCode).json({
    status: "error",
    message:
      error.message || fallbackMessage,
    error:
      fhirErrors?.length > 0
        ? fhirErrors
        : [
          error.cause?.message ??
              error.message ??
              fallbackMessage,
        ],
    ...(error.consents
      ? { consents: error.consents }
      : {}),
    ...(error.visit
      ? { visit: error.visit }
      : {}),
  });
};
