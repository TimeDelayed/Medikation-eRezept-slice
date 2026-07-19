import AuditTrail from "../db/schema/auditTrail.schema.js";

//https://dev.to/mwangikibui/handling-audit-logging-in-nodejs-2j3f
export const auditMiddleware = async (req, res, next) => {

  //console.log(req.auditOptions);
  try {
    const originalJson = res.json;
    res.json = async function (body) {
      //console.log(req.user);
      await AuditTrail.create({
        actor: {
          userId: req.user?.name ?? "UNDEFINED",
          userRoles: req.user?.roles ?? ["UNDEFINED"],
        },
        action: req.auditOptions?.action,
        ressourceType: req?.auditOptions?.resourceType,
        resourceId: req?.idStorage?.resourceId ?? "UNDEFINED",
        patientRef: req?.idStorage?.patientRef ?? "UNDEFINED",
        url:req.originalUrl,
        method:req.method,
        statusCode: res.statusCode,
      });
      return originalJson.call(this,body);
    };
    next();
  } catch(error) {
    //console.log(">>>>> an error occurred logging audit trail >>>>>>>>");
    //console.log(error.message);
    next();
  }
};
