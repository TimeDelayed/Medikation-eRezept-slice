import {
  fhirPostPatient,
  fhirGetPatientByIdentifier,
  fhirGetPatientsByDemographics,
  fhirGetActivePatientConsents,
  SYSTEMNAME,
} from "../fhirClient/fhir-client.js";
import { createFhirPatient } from "../util/mapper.js";

export const searchPatientHandler = async (req, res) => {
  const { kv, familyName, givenName, birthday, address, gender } = req.query;

  if (kv) {
    const patient = await fhirGetPatientByIdentifier(`${SYSTEMNAME}|${kv}`);

    if (patients.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patients.length > 1) {
      return res.status(500).json({
        error: "Duplicate patient identifiers detected",
      });
    }

    return res.status(200).json(patients[0]);
  }

  const patients = await fhirGetPatientsByDemographics({
    familyName,
    givenName,
    birthday,
    address,
    gender,
  });

  if (patients.length === 0) {
    return res.status(404).json({ error: "Patient not found" });
  }

  if (patients.length > 1) {
    return res.status(409).json({
      error: "Multiple patients match the provided data",
      patients,
    });
  }

  return res.status(200).json(patients[0]);
};

//TODO: create other intake endpoints

export const createVisitHandler = async (req, res) => {
  res.status(500);
};

export const checkConsentHandler = async (req, res) => {
  const { patient, category } = req.query;
  if (!patient || !category) {
    return res.status(400).json({
      error: "Missing required query parameters: patient, consent category",
    });
  }

  const patientIdNoPrefix = patient.replace(/^Patient\//, "");

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
  res.status(500);
};

export const submitAnamnesisHandler = async (req, res) => {
  res.status(500);
};

export const createPatientHandler = async (req, res) => {
  const {
    kv,
    insuranceType,
    familyName,
    givenNames,
    gender,
    birthday,
    address,
  } = req.body;
  console.log(kv);
  console.log(insuranceType);
  console.log(familyName);
  console.log(givenNames);
  console.log(gender);
  console.log(birthday);
  console.log(address);

  console.log(JSON.stringify(req.body));
  if (!kv || !insuranceType || !familyName || !givenNames) {
    return res.status(400).json({
      error:
        "Missing required fields. Require KV, insurance type, family name, given name!",
    });
  }
  const newPatient = createFhirPatient(req.body);
  console.log("test");
  try {
    const result = await fhirPostPatient(newPatient);
    res.status(200).json(result);
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
