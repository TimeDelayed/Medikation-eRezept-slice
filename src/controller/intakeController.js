import {fhirPostPatient, fhirGetPatientsByIdentifier, SYSTEMNAME} from "../fhirClient/fhir-client.js";
import {createFhirPatient} from "../util/mapper.js";

const patientTieBreaker = (patients) => {
  // TODO: implement later
  return patients[0];
};

export const searchPatientByIdentifierHandler = async (req, res) => {
  const kv = req.params.kv;

  // https://hl7.org/fhir/R4/search.html#token
  let patients = await fhirGetPatientsByIdentifier(`${SYSTEMNAME}|${kv}`)

  if(patients.length === 0) {
    return res.status(404).json({ error: 'Patient not found' })
  }
  if(patients.length > 1) {
    patients = patientTieBreaker(patients)
  }
  return res.status(200).json(patients)
};

//TODO: create other intake endpoints

export const createVisitHandler = async (req, res) => {
  res.status(500)
}

export const checkConsentHandler = async (req, res) => {
  res.status(500)
}

export const recordConsentHandler = async (req, res) => {
  res.status(500)
}

export const submitAnamnesisHandler = async (req, res) => {
  res.status(500)
}

export const createPatientHandler = async (req, res) => {
  const {kv, insuranceType, familyName, givenNames, gender, birthDate} = req.body
  console.log(kv)
  console.log(insuranceType)
  console.log(familyName)
  console.log(givenNames)
  console.log(gender)
  console.log(birthDate)

  console.log(JSON.stringify(req.body))
  if(!kv || !insuranceType || !familyName || !givenNames || !gender || !birthDate) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const newPatient = createFhirPatient(req.body)
  console.log("test")
  try {
    const result = await fhirPostPatient(newPatient)
    res.status(200).json(result)
  }
  catch(e) {
    console.error(e)
    res.status(e.response?.status ?? 502).json({
      status: 'error',
      message: 'FHIR patient search failed',
      error: e.response?.data?.issue?.map(i => i.diagnostics ?? i.code) ?? [e.message],
    })
  }
}
