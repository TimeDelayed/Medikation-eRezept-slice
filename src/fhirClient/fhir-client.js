import axios from "axios";

import { FHIR_BASE_URL } from "../constants/fhirConstants.js";

const getEntries = (bundle) => (bundle.entry ?? []).map((e) => e.resource);

// Create default axios client
export const fhir = axios.create({
  baseURL: FHIR_BASE_URL,
  headers: {
    "Content-Type": "application/fhir+json",
    Accept: "application/fhir+json",
  },
});

const requireValue = (value, name) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${name} is required`);
  }
};

// ---------- Patient ----------

/**
 * Fhir excpects for the identifier to be in the format: <system>|<value>
 * This function creates a FHIR identifier for a patient based on the provided kv and insuranceType.
 *
 * Param identifier must be a string in the format <system>|<value> where system is either GKV or PKV and value is the kv number.
 *
 **/
export const fhirGetPatientByIdentifier = async (identifier) => {
  requireValue(identifier, "identifier");

  const result = await fhir.get("/Patient", {
    params: { identifier },
  });

  return getEntries(result.data);
};

/**
 * Searches for Patients using demographic information.
 *
 * FHIR search parameters:
 * - family:    Family name (string)
 * - given:     Given name (string)
 * - birthdate: Date in FHIR format (YYYY-MM-DD)
 * - address:   Free-text address search (matches any address component)
 *
 * All parameters are optional. The FHIR server returns all Patients
 * matching the supplied search criteria.
 *
 * https://hl7.org/fhir/R4/patient.html#search
 */
export const fhirGetPatientsByDemographics = async ({
  familyName,
  givenName,
  birthday,
  address,
  gender,
}) => {
  const params = {};

  if (familyName) {
    params.family = familyName;
  }
  if (givenName) {
    params.given = givenName;
  }
  if (birthday) {
    params.birthdate = birthday;
  }
  if (address) {
    params.address = address;
  }
  if (gender) {
    params.gender = gender;
  }

  const result = await fhir.get("/Patient", { params });

  return getEntries(result.data);
};

export const fhirGetPatientById = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get(`/Patient/${patientId}`);

  return result.data;
};

export const fhirPostPatient = async (newPatient) => {
  requireValue(newPatient, "newPatient");

  const result = await fhir.post("/Patient", newPatient);

  return result.data;
};

// ---------- Condition ----------

export const fhirGetConditionById = async (conditionId) => {
  requireValue(conditionId, "conditionId");

  const result = await fhir.get(`/Condition/${conditionId}`);

  return result.data;
};

export const fhirGetAllConditionsByPatientId = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get("/Condition", {
    params: {
      subject: patientId,
    },
  });

  return getEntries(result.data);
};

export const fhirPostCondition = async (newCondition) => {
  requireValue(newCondition, "newCondition");

  const result = await fhir.post("/Condition", newCondition);

  return result.data;
};

// ---------- Consent ----------

export const fhirGetConsentById = async (consentId) => {
  requireValue(consentId, "consentId");

  const result = await fhir.get(`/Consent/${consentId}`);

  return result.data;
};

export const fhirGetAllConsentsByPatientId = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get("/Consent", {
    params: {
      patient: patientId,
    },
  });

  return getEntries(result.data);
};

export const fhirGetActivePatientConsents = async (patientId, category) => {
  requireValue(patientId, "patientId");
  requireValue(category, "category");

  const result = await fhir.get("/Consent", {
    params: {
      patient: patientId,
      category: category,
      status: "active",
    },
  });
  return getEntries(result.data);
};

export const fhirPostConsent = async (newConsent) => {
  requireValue(newConsent, "newConsent");

  const result = await fhir.post("/Consent", newConsent);

  return result.data;
};

export const fhirPutConsent = async (consent) => {
  requireValue(consent, "consent");
  requireValue(consent.id, "consent.id");

  const result = await fhir.put(`/Consent/${consent.id}`, consent);

  return result.data;
};

// ---------- Medication ----------

export const fhirGetMedicationById = async (medicationId) => {
  requireValue(medicationId, "medicationId");

  const result = await fhir.get(`/Medication/${medicationId}`);

  return result.data;
};

export const fhirPostMedication = async (newMedication) => {
  requireValue(newMedication, "newMedication");

  const result = await fhir.post("/Medication", newMedication);

  return result.data;
};

// ---------- MedicationRequest ----------

export const fhirGetMedicationRequestById = async (medicationRequestId) => {
  requireValue(medicationRequestId, "medicationRequestId");

  const result = await fhir.get(`/MedicationRequest/${medicationRequestId}`);

  return result.data;
};

export const fhirGetAllMedicationRequestsByPatientId = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get("/MedicationRequest", {
    params: {
      subject: patientId,
    },
  });

  return getEntries(result.data);
};

export const fhirPostMedicationRequest = async (newMedicationRequest) => {
  requireValue(newMedicationRequest, "newMedicationRequest");

  const result = await fhir.post("/MedicationRequest", newMedicationRequest);

  return result.data;
};

// ---------- MedicationStatement ----------

export const fhirGetMedicationStatementById = async (medicationStatementId) => {
  requireValue(medicationStatementId, "medicationStatementId");

  const result = await fhir.get(
    `/MedicationStatement/${medicationStatementId}`,
  );

  return result.data;
};

export const fhirGetAllMedicationStatementsByPatientId = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get("/MedicationStatement", {
    params: {
      subject: patientId,
    },
  });

  return getEntries(result.data);
};

export const fhirPostMedicationStatement = async (newMedicationStatement) => {
  requireValue(newMedicationStatement, "newMedicationStatement");

  const result = await fhir.post(
    "/MedicationStatement",
    newMedicationStatement,
  );

  return result.data;
};

// ---------- Provenance ----------

export const fhirGetProvenanceById = async (provenanceId) => {
  requireValue(provenanceId, "provenanceId");

  const result = await fhir.get(`/Provenance/${provenanceId}`);

  return result.data;
};

export const fhirGetAllProvenanceByPatientId = async (patientId) => {
  requireValue(patientId, "patientId");

  const result = await fhir.get("/Provenance", {
    params: {
      patient: patientId,
    },
  });

  return getEntries(result.data);
};

export const fhirPostProvenance = async (newProvenance) => {
  requireValue(newProvenance, "newProvenance");

  const result = await fhir.post("/Provenance", newProvenance);

  return result.data;
};

// ---------- Bundle ----------

export const fhirPostTransactionBundle = async (transactionBundle) => {
  requireValue(transactionBundle, "transactionBundle");

  const result = await fhir.post("/", transactionBundle);

  return result.data;
};
