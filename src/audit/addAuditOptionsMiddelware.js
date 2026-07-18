export const addAuditOptions = (action, resourceType) => {

  return function (req, res, next) {
    req.auditOptions = {
      action: action,
      resourceType: resourceType,
    };
    next();
  };
};
