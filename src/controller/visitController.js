import {
  getAllVisits,
  submitAnamnesis,
  submitMedicationRequest,
  createVisitFromDemographics,
  createVisitFromKv,
} from "../services/visitService.js";
import {
  validateCreateVisitDemographicsInput,
  validateCreateVisitKVInput,
  validateMedicationRequestInput,
  validateSubmitAnamnesisInput,
} from "../util/validators.js";

import {
  sendErrorResponse,
} from "../util/errorHelpers.js";
import { findVisitById } from "../util/dbHelpers.js";
import { setAuditIdsHelper } from "../audit/auditHelper.js";
import { VISIT_COMPLETED_ANAMNESIS, VISIT_FINALIZED } from "../constants/fhirConstants.js";
import { response } from "express";


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

    setAuditIdsHelper(req, {
      resourceId: result.visitId,
      patientRef: result.patientFhirId,
    });

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

    setAuditIdsHelper(req, {
      resourceId: result.visitId,
      patientRef: result.patientFhirId,
    });

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

    // we already set the patientID here for the Audit
    // if the request failes we already have the patient Fhir Id
    setAuditIdsHelper(req, {
      patientRef: (await findVisitById(visitId))
        ?.patientFhirId,
    });

    const result = await submitAnamnesis({
      visitId,
      user: req.user,
      ...req.body,
    });


    setAuditIdsHelper(req, {
      resourceId: result.fhirBundleRef,
      entities: result.createdEntities,
    });

    return res.status(201).json(result);
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

export const createMedicationRequestBundleHandler =
  async (req, res) => {
    const { visitId } = req.params;

    try {
      validateMedicationRequestInput({
        visitId,
        body: req.body,
      });

      // set early, so failed requests are audited with the patient too
      setAuditIdsHelper(req, {
        patientRef: (await findVisitById(visitId))
          ?.patientFhirId,
      });

      const result =
        await submitMedicationRequest({
          visitId,
          ...req.body,
          user: req.user,
        });


      setAuditIdsHelper(req, {
        resourceId: result.fhirBundleRef,
        entities: result.createdEntities,
      });

      return res.status(201).json(result);
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
        "Creation of MedicationRequest failed.",
      );
    }
  };
