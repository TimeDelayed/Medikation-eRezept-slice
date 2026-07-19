import Visit from "../db/schema/visit.schema.js";

export const checkIfPatientHasPendingVisit = async (patientFhirId) => {
  try {
    return await Visit.findOne({
      patientFhirId,
      visitStatus: { $ne: "done" },
    });
  } catch (e) {
    throw new Error("Database failed", {
      cause: e,
    });
  }

};
