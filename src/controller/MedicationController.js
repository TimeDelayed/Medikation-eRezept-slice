import { fhirGetAllMedicationStatementsByPatientId } from "../fhirClient/fhir-client.js";
import { findVisitById } from "../util/dbHelpers.js";
import { sendErrorResponse } from "../util/errorHelpers.js";

export const getMedicationStatementHandler = async (
  req,
  res,
) => {
  const visitId = req.params.visitId;


  const currentVisit = await findVisitById(visitId);



  try {
    const subject = currentVisit.patientFhirId;

    const result = await fhirGetAllMedicationStatementsByPatientId(
      subject,
    );
    console.log(result);
    console.log(JSON.stringify(result));

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(
      res,
      error,
      "Get Medication Request failed.",
    );
  }
};
