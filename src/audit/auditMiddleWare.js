import { randomUUID } from "node:crypto";
import AuditTrail from "../db/schema/auditTrail.schema.js";

//https://dev.to/mwangikibui/handling-audit-logging-in-nodejs-2j3f
export const auditMiddleware = async (req, res, next) => {

  // eine zentrale id
  req.transactionId = randomUUID();

  const originalJson = res.json;

  res.json = async function (body) {
    try {
      await AuditTrail.create({
        transactionId: req.transactionId,
        actor: {
          userId: req.user?.sub ?? "UNDEFINED",
          userRoles: req.user?.roles ?? ["UNDEFINED"],
        },
        action: req.auditOptions?.action,
        ressourceType: req.auditOptions?.resourceType,
        resourceId: req.idStorage?.resourceId,
        patientRef: req.idStorage?.patientRef,
        visitId: req.auditOptions?.visitId,
        entities: req.idStorage?.entities ?? [],
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        // wir hohlen auch den error vom allgemeinen error handler (errorHelpers)
        error: req.auditError,
      });
    } catch (error) {
      console.error(
        "Writing audit failed!",
        error.message,
      );
    }



    return originalJson.call(this, body);
  };

  next();
};
