
import { VISIT_COMPLETED_ANAMNESIS, VISIT_FINALIZED, VISIT_STARTED_STATUS } from "../constants/fhirConstants.js";
import Visit from "../db/schema/visit.schema.js";
import { AppError } from "../errors/AppError.js";
import { hashHelperKV as hashHelperKV } from "./hashingHelper.js";

/**
 * Executes a database operation and converts database errors
 * into a consistent AppError.
 */
const executeDatabaseOperation = async (
  operation,
  errorMessage = "Database operation failed.",
) => {
  try {
    return await operation();
  } catch (error) {
    throw new AppError(500, errorMessage, {
      cause: error,
    });
  }
};

/**
 * Returns an unfinished Visit for a FHIR Patient.
 *
 * Returns:
 * - Visit document if found
 * - null if no pending Visit exists
 */
export const checkIfPatientHasPendingVisit = async (
  patientFhirId,
) => {
  return executeDatabaseOperation(
    () =>
      Visit.findOne({
        patientFhirId,
        visitStatus: {
          $ne: "done",
        },
      }),
    "Database failed while checking for a pending Visit.",
  );
};

/**
 * Returns a Visit by its public visitId, if it exists in the database
 * and is not yet completed.
 *
 * Returns:
 * - Visit document if found
 * - null if no Visit exists or the Visit is already completed
 */
export const findPendingVisitById = async (visitId) => {
  return executeDatabaseOperation(
    () => Visit.findOne({
      visitId,
      visitStatus: { $in: [VISIT_STARTED_STATUS] },
    }),
    "Database failed while loading the Visit.",
  );
};

/**
 * Creates a local Visit.
 */
export const createLocalVisit = async ({
  kv,
  patientFhirId,
  visitStatus = "started",
}) => {
  const kvHash = hashHelperKV(kv);
  return executeDatabaseOperation(
    () =>
      Visit.create({
        kvHash,
        patientFhirId,
        visitStatus,
      }),
    "Database failed while creating the Visit.",
  );
};

/**
 * Returns all locally stored Visits.
 */
export const findAllVisits = async () => {
  return executeDatabaseOperation(
    () => Visit.find({}),
    "Database failed while loading Visits.",
  );
};

/**
 * Returns a Visit by its public visitId.
 */
export const findVisitById = async (visitId) => {
  return executeDatabaseOperation(
    () => Visit.findOne({ visitId }),
    "Database failed while loading the Visit.",
  );
};
