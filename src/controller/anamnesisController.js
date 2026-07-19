import {
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
} from "../fhirClient/fhir-client.js";

import Visit from "../db/schema/visit.schema.js";

import { createFhirPatient } from "../util/mapper.js";

import {
  createGermanFhirAddress,
  createIdentifierSearchToken,
  patientsTieBreaker,
} from "../util/fhirHelpers.js";

import { submitAnamnesis } from "../services/anamnesisService.js";
import { checkIfPatientHasPendingVisit } from "../util/dbHelpers.js";

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

  const fhirAddress = address?.text
    ? createGermanFhirAddress(address)
    : createGermanFhirAddress({ text: address });

  let patients;

  if (kv && insuranceType) {
    const identifier = createIdentifierSearchToken(
      kv,
      insuranceType,
    );

    patients = await fhirGetPatientByIdentifier(identifier);
  } else {
    patients = await fhirGetPatientsByDemographics({
      familyName,
      givenName,
      birthday,
      address: fhirAddress,
      gender,
    });
  }

  if (patients.length > 0) {
    const patient = patientsTieBreaker(
      patients,
      familyName,
      givenName,
      birthday,
      fhirAddress,
      gender,
    );

    if (patient) {
      return patient;
    }
  }

  const newPatient = createFhirPatient({
    kv,
    insuranceType,
    familyName,
    givenNames,
    birthday,
    address: fhirAddress,
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

    try {
      const patientExistingPendingVisit = await checkIfPatientHasPendingVisit(patient.id);
      if (patientExistingPendingVisit) {
        return res.status(409).json({
          error:
            "Patient already has a pending visit.",
          visit: patientExistingPendingVisit,
        });
      }
    } catch (e) {
      return res.status(502).json({
        error:
          "Database failed while checking for existing pending visit.",
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
      patient,
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
export const getAllVisits = async (req, res) => {
  try {
    const allVisits = await Visit.find({});
    return res.status(200).json(allVisits);
  } catch (e) {
    return res.status(500).json({
      error: "Database failed.",
    });
  }
};

/**
 * Make an anamnesis.
 *
 * Makes an anamnesis that is stored locally in the Visit. If the patient has a consent or gives his consent,
 * this anamnesis then is send as a transaction bundle to the FHIR server.
 */
export const submitAnamnesisHandler = async (
  req,
  res,
) => {
  const { visitId } = req.params;

  if (!visitId) {
    return res.status(400).json({
      error:
        "Missing required path parameter: visitId",
    });
  }

  try {
    const result = await submitAnamnesis({
      visitId,
      ...req.body,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.log(
      JSON.stringify(error.response?.data, null, 2),
    );
    return res
      .status(
        error.statusCode ??
          error.response?.status ??
          502,
      )
      .json({
        status: "error",
        message:
          error.message ||
          "Anamnesis submission failed",
        ...(error.consents
          ? { consents: error.consents }
          : {}),
        error:
          error.response?.data?.issue?.map(
            (issue) =>
              issue.diagnostics ?? issue.code,
          ) ?? [error.message],
      });
  }
};
