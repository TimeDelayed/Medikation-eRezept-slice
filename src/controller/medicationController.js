import { fhirGetAllMedicationStatementsByPatientId } from "../fhirClient/fhir-client.js";
import { findVisitById } from "../util/dbHelpers.js";
import { sendErrorResponse } from "../util/errorHelpers.js";
import { setAuditIdsHelper } from "../audit/auditHelper.js";
import { ResourceType } from "../db/schema/ressourceType.js";

export const getMedicationStatementHandler = async (
  req,
  res,
) => {
  const visitId = req.params.visitId;

  const currentVisit = await findVisitById(visitId);

  try {
    const subject = currentVisit.patientFhirId;

    setAuditIdsHelper(req, { patientRef: subject });

    const result = await fhirGetAllMedicationStatementsByPatientId(
      subject,
    );
    console.log(result);
    console.log(JSON.stringify(result));

    // create all entitys
    setAuditIdsHelper(req, {
      entities: result.map((medicationStatement) => ({
        ressourceType: ResourceType.MEDICATION_STATEMENT,
        resourceId: medicationStatement.id,
      })),
    });

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
