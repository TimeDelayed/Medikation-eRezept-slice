/**
 * Collects the ids of everything a request touched, so the
 * auditMiddleware can write them once the response is sent.
 * Has to be called before res.json().
 *
 * resourceId / patientRef describe the primary resource of the route.
 * entities lists every resource a transaction Bundle actually created,
 * because one request can touch a Consent, several Conditions and
 * several MedicationStatements at once.
 */
export const setAuditIdsHelper = (
  req,
  { resourceId, patientRef, entities } = {},
) => {
  // spread idStorage and update it
  // if empty we just put an empty object
  req.idStorage = {
    ...req.idStorage,
    ...(resourceId ? { resourceId } : {}),
    ...(patientRef ? { patientRef } : {}),
    // entities are appended (if more then one entity is created)
    ...(entities?.length
      ? {
        // spread old entitys into array and append new one
        entities: [
          ...(req.idStorage?.entities ?? []),
          ...entities,
        ],
      }
      : {}),
  };
};
