import {
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
  fhirGetActivePatientConsents,
  fhirPostConsent,
  fhirPutConsent,
} from "../fhirClient/fhir-client.js";
import { FHIR_NAMESPACE } from "../constants/fhirConstants.js";
import { createFhirPatient, createFhirConsent } from "../util/mapper.js";
import {
  createIdentifierSearchToken,
  patientsTieBreaker,
} from "../util/fhirHelpers.js";

// Had to be rewritten to not assume that kv numbers are unique across patients.
// Our Fhir test server does not enforce this, and it is possible that a  kv numbers has multiple patients.
// Therefore, we need to search by demographics if no kv number is provided. If a kv number is provided,
// we first search by identifier, and if that fails, we fall back to demographic search.
export const searchPatientHandler = async (req, res) => {
  const {
    kv,
    insuranceType,
    familyName,
    givenName,
    birthday,
    address,
    gender,
  } = req.query;

  if (!familyName || !givenName || !birthday || !address || !gender) {
    return res.status(400).json({
      error:
        "Missing required query parameters. Require family name, given name, birthday, address, gender!",
    });
  }

  let patients;

  if (kv && insuranceType) {
    const identifier = createIdentifierSearchToken(kv, insuranceType);
    patients = await fhirGetPatientByIdentifier(identifier);

    if (patients.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patients.length === 1) {
      return res.status(200).json(patients[0]);
    }
  } else {
    patients = await fhirGetPatientsByDemographics({
      familyName,
      givenName,
      birthday,
      address,
      gender,
    });
  }

  const patient = patientsTieBreaker(
    patients,
    familyName,
    givenName,
    birthday,
    address,
    gender,
  );

  if (!patient) {
    return res.status(404).json({
      error: "Patient not found",
    });
  }

  return res.status(200).json(patient);
};

//TODO: create other intake endpoints

export const createVisitHandler = async (req, res) => {
  return res.status(500).json("Error");
};

export const checkConsentHandler = async (req, res) => {
  const { patientId, category } = req.query;
  if (!patientId || !category) {
    return res.status(400).json({
      error: "Missing required query parameters: patient, consent category",
    });
  }

  const patientIdNoPrefix = patientId.replace(/^Patient\//, "");

  try {
    const consents = await fhirGetActivePatientConsents(
      patientIdNoPrefix,
      category,
    );
    res.status(200).json(consents);
  } catch (e) {
    console.error(e);
    res.status(e.response?.status ?? 502).json({
      status: "error",
      message: "FHIR consent search failed",
      error: e.response?.data?.issue?.map((i) => i.diagnostics ?? i.code) ?? [
        e.message,
      ],
    });
  }
};

export const recordConsentHandler = async (req, res) => {
  const { patientId, category, status } = req.body;

  if (!patientId || !category || !status) {
    return res.status(400).json({
      error:
        "Missing required body parameters: patientId, category, status",
    });
  }

  if (status !== "active") {
    return res.status(400).json({
      error:
        "New consents must be created with status active. Use the update endpoint to revoke or change a consent.",
    });
  }

  const patientIdNoPrefix = patientId.replace(/^Patient\//, "");

  try {
    const activeConsents = await fhirGetActivePatientConsents(
      patientIdNoPrefix,
      category,
    );

    if (activeConsents.length > 0) {
      return res.status(409).json({
        error:
          "An active consent already exists for this patient and category. Use the update endpoint to revoke or modify it.",
        consents: activeConsents,
      });
    }

    const newConsent = createFhirConsent({
      patientId: patientIdNoPrefix,
      category,
      status,
    });

    const result = await fhirPostConsent(newConsent);

    return res.status(201).json(result);
  } catch (e) {
    console.error(e);

    return res.status(e.response?.status ?? 502).json({
      status: "error",
      message: "FHIR consent creation failed",
      error:
        e.response?.data?.issue?.map(
          (issue) => issue.diagnostics ?? issue.code,
        ) ?? [e.message],
    });
  }
};

export const submitAnamnesisHandler = async (req, res) => {
  res.status(500);
};

export const createPatientHandler = async (req, res) => {
  const {
    kv,
    insuranceType,
    name,
    gender,
    birthday,
    address,
    telecom,
    maritalStatus,
    communication,
    contact,
  } = req.body;

  console.log(JSON.stringify(req.body));
  if (!kv || !insuranceType || !name[0].family || !name[0].given) {
    return res.status(400).json({
      error:
        "Missing required fields. Require KV, insurance type, family name, given name!",
    });
  }
  const newPatient = createFhirPatient(req.body);
  console.log("test");
  try {
    const result = await fhirPostPatient(newPatient);
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(e.response?.status ?? 502).json({
      status: "error",
      message: "FHIR patient create failed",
      error: e.response?.data?.issue?.map((i) => i.diagnostics ?? i.code) ?? [
        e.message,
      ],
    });
  }
};
