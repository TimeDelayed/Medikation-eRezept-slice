// ---------- Patient ----------

export const fhirGetPatientsByIdentifier = async (identifier) => {
  const result = await fhir.get("/Patient", {
    params: { identifier },
  });
  return getEntries(result.data);
};

export const fhirGetPatientById = async (patientId) => {
  const result = await fhir.get(`/Patient/${patientId}`);
  return result.data;
};

export const fhirPostPatient = async (newPatient) => {
  const result = await fhir.post("/Patient", newPatient);
  return result.data;
};

// ---------- Condition ----------

export const fhirGetConditionById = async (conditionId) => {
  const result = await fhir.get(`/Condition/${conditionId}`);
  return result.data;
};

export const fhirPostCondition = async (newCondition) => {
  const result = await fhir.post("/Condition", newCondition);
  return result.data;
};

// ---------- Consent ----------

export const fhirGetConsentById = async (consentId) => {
  const result = await fhir.get(`/Consent/${consentId}`);
  return result.data;
};

export const fhirPostConsent = async (newConsent) => {
  const result = await fhir.post("/Consent", newConsent);
  return result.data;
};

// ---------- Medication ----------

export const fhirGetMedicationById = async (medicationId) => {
  const result = await fhir.get(`/Medication/${medicationId}`);
  return result.data;
};

export const fhirPostMedication = async (newMedication) => {
  const result = await fhir.post("/Medication", newMedication);
  return result.data;
};

// ---------- MedicationRequest ----------

export const fhirGetMedicationRequestById = async (medicationRequestId) => {
  const result = await fhir.get(`/MedicationRequest/${medicationRequestId}`);
  return result.data;
};

export const fhirPostMedicationRequest = async (newMedicationRequest) => {
  const result = await fhir.post("/MedicationRequest", newMedicationRequest);
  return result.data;
};

// ---------- MedicationStatement ----------

export const fhirGetMedicationStatementById = async (medicationStatementId) => {
  const result = await fhir.get(
    `/MedicationStatement/${medicationStatementId}`,
  );
  return result.data;
};

export const fhirPostMedicationStatement = async (newMedicationStatement) => {
  const result = await fhir.post(
    "/MedicationStatement",
    newMedicationStatement,
  );
  return result.data;
};

// ---------- Provenance ----------

export const fhirGetProvenanceById = async (provenanceId) => {
  const result = await fhir.get(`/Provenance/${provenanceId}`);
  return result.data;
};

export const fhirPostProvenance = async (newProvenance) => {
  const result = await fhir.post("/Provenance", newProvenance);
  return result.data;
};

// ---------- Bundle ----------

export const fhirPostTransactionBundle = async (transactionBundle) => {
  const result = await fhir.post("/", transactionBundle);
  return result.data;
};
