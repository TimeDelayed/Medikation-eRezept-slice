import {
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
} from "../fhirClient/fhir-client.js";

import Visit from "../db/schema/visit.schema.js";

import { createFhirPatient } from "../util/mapper.js";

import {
  createIdentifierSearchToken,
  patientsTieBreaker,
} from "../util/fhirHelpers.js";
import mongoose from "mongoose";

/**
 * Finds an existing FHIR Patient or creates a new one.
 *
 * Search order:
 * 1. Insurance identifier
 * 2. Demographic tie-breaker
 * 3. Demographic search
 * 4. Create a new Patient
 */
const findOrCreatePatient = async ({
  kv,
  insuranceType,
  familyName,
  givenNames,
  birthday,
  address,
  gender,
}) => {
  const givenName = givenNames[0];

  const identifier = createIdentifierSearchToken(
    kv,
    insuranceType,
  );

  const patientsByIdentifier =
    await fhirGetPatientByIdentifier(identifier);

  if (patientsByIdentifier.length === 1) {
    return patientsByIdentifier[0];
  }

  if (patientsByIdentifier.length > 1) {
    const matchingPatient = patientsTieBreaker(
      patientsByIdentifier,
      familyName,
      givenName,
      birthday,
      address,
      gender,
    );

    if (matchingPatient) {
      return matchingPatient;
    }
  }

  const patientsByDemographics =
    await fhirGetPatientsByDemographics({
      familyName,
      givenName,
      birthday,
      address,
      gender,
    });

  if (patientsByDemographics.length === 1) {
    return patientsByDemographics[0];
  }

  if (patientsByDemographics.length > 1) {
    const matchingPatient = patientsTieBreaker(
      patientsByDemographics,
      familyName,
      givenName,
      birthday,
      address,
      gender,
    );

    if (matchingPatient) {
      return matchingPatient;
    }
  }

  const newPatient = createFhirPatient({
    kv,
    insuranceType,
    familyName,
    givenNames,
    birthday,
    address,
    gender,
  });

  return fhirPostPatient(newPatient);
};

/**
 * Starts a Visit.
 *
 * The Patient is first searched on the FHIR server.
 * If no matching Patient exists, a new Patient is created.
 * The resulting FHIR Patient id is stored in the local Visit.
 */
export const createVisitHandler = async (req, res) => {
  const {
    kv,
    insuranceType,
    familyName,
    givenNames,
    birthday,
    address,
    gender,
  } = req.body;

  if (
    !kv ||
    !insuranceType ||
    !familyName ||
    !Array.isArray(givenNames) ||
    givenNames.length === 0 ||
    !birthday ||
    !address ||
    !gender
  ) {
    return res.status(400).json({
      error:
        "Missing required body parameters: kv, insuranceType, familyName, givenNames, birthday, address, gender",
    });
  }

  try {
    const patient = await findOrCreatePatient({
      kv,
      insuranceType,
      familyName,
      givenNames,
      birthday,
      address,
      gender,
    });

    if (!patient?.id) {
      return res.status(502).json({
        error:
          "FHIR Patient response did not contain a resource id",
      });
    }

    const visit = await Visit.create({
      kv,
      patientFhirId: patient.id,
      visitStatus: "started",
    });

    return res.status(201).json({
      visitId: visit.visitId,
      visitStatus: visit.visitStatus,
      patientFhirId: visit.patientFhirId,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.response?.status ?? 502).json({
      status: "error",
      message: "Visit creation failed",
      error:
        error.response?.data?.issue?.map(
          (issue) => issue.diagnostics ?? issue.code,
        ) ?? [error.message],
    });
  }
};

/**
 * Show all current Visits
 *
 * Shows all finalized and pending visits inside the Db
 */
const getAllVisits = (req, res) => {
  const allVisits = Visit.find().all();
  return res.status(200).json({ allVisits });
};

/**
 * Make an anamnesis
 *
 * Makes an anamnesis that is stored locally in the Visit. If the patient has a consent or gives his consent,
 * this anamnesis then is send as a transaction bundle to the FHIR server.
 *
 */
const submitAnamnesisHandler = (req, res) => {
  const { condition, medicationStatement, consent } = req.body;
  const { visitId } = req.param;
  
}