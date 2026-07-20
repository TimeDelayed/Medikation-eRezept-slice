import {
  getAllVisits, submitAnamnesis,createVisitFromDemographics, createVisitFromKv,
} from "../services/visitService.js";
import {
  validateCreateVisitDemographicsInput,
  validateCreateVisitKVInput,
  validateSubmitAnamnesisInput,
} from "../util/validators.js";

import {
  sendErrorResponse,
} from "../util/errorHelpers.js";
import { findVisitById } from "../util/dbHelpers.js";
import { createFhirMedicationRequest, createFhirTransactionBundle } from "../util/mapper.js";
import { fhirPostTransactionBundle } from "../fhirClient/fhir-client.js";
import { AppError } from "../errors/AppError.js";


/**
 * Starts a Visit by searching a patient via insurance number (kv).
 *
 * The Patient is first searched on the FHIR server.
 * The resulting FHIR Patient id is stored in the local Visit.
 */
export const createVisitKVHandler = async (
  req,
  res,
) => {
  try {
    validateCreateVisitKVInput(req.body);

    const result = await createVisitFromKv(
      req.body,
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(
      res,
      error,
      "Visit creation failed.",
    );
  }
};

/**
 * Starts a Visit by searching a patient via insurance number (kv).
 *
 * The Patient is first searched on the FHIR server.
 * If no matching Patient exists, a new Patient is created.
 * The resulting FHIR Patient id is stored in the local Visit.
 */
export const createVisitDemographicsHandler = async (
  req,
  res,
) => {
  try {
    validateCreateVisitDemographicsInput(req.body);

    const result = await createVisitFromDemographics(
      req.body,
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(
      res,
      error,
      "Visit creation failed.",
    );
  }
};

/**
 * Show all current Visits.
 *
 * Shows all finalized and pending Visits inside the database.
 */
export const getAllVisitsHandler = async (
  req,
  res,
) => {
  try {
    const visits = await getAllVisits();

    return res.status(200).json(visits);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(
      res,
      error,
      "Loading Visits failed.",
    );
  }
};

/**
 * Make an anamnesis.
 *
 * Makes an anamnesis that is stored locally in the Visit.
 * If the patient has a Consent or gives Consent, the anamnesis
 * is sent to the FHIR server as a transaction Bundle.
 */
export const submitAnamnesisHandler = async (
  req,
  res,
) => {
  const { visitId } = req.params;

  try {
    validateSubmitAnamnesisInput({
      visitId,
      body: req.body,
    });

    const result = await submitAnamnesis({
      visitId,
      user: req.user,
      ...req.body,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      JSON.stringify(
        error.response?.data,
        null,
        2,
      ),
    );

    return sendErrorResponse(
      res,
      error,
      "Anamnesis submission failed.",
    );
  }
};

export const createMedicationRequestBundleHandler = async (
  req,
  res,
) => {
  const visitId = req.params.visitId;

  try {
    const { code, display } = req.body;

    const currentVisit = await findVisitById(visitId);

    if (!currentVisit) {
      throw new AppError(
        404,
        `No Visit with ${visitId} found.`,
      );
    }

    const newMedicationRequest = createFhirMedicationRequest({
      patientId: currentVisit.patientFhirId,
      code,
      display,
    });

    const bundle = createFhirTransactionBundle(
      [newMedicationRequest],
      req.user,
    );

    const result = await fhirPostTransactionBundle(bundle);

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);

    return sendErrorResponse(
      res,
      error,
      "creation of Prescription failed.",
    );
  }
};
