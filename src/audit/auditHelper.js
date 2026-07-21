/**
 * Collects the ids of everything a request touched.
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
