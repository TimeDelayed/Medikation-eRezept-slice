export const SYSTEMNAME = "EASY"

const requireValue = (value, name) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${name} is required`);
  }
};

// ---------- Patient ----------

export const fhirGetPatientsByIdentifier = async (identifier) => {
  requireValue(identifier, "identifier");

  const result = await fhir.get("/Patient", {
    params: { identifier },
  });

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

export const fhirPostConsent = async (newConsent) => {
  requireValue(newConsent, "newConsent");

  const result = await fhir.post("/Consent", newConsent);
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
