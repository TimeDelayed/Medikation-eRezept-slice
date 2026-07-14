import fs from "node:fs/promises";
import axios from "axios";

const FHIR_BASE_URL = "https://hapi.fhir.org/baseR4";
export const SYSTEMNAME =
  "https://easyhealth.example/fhir/CodeSystem/";

const getEntries = (bundle) => (bundle.entry ?? []).map((e) => e.resource);

// create default axios client
export const fhir = axios.create({
  baseURL: FHIR_BASE_URL,
  headers: {
    "Content-Type": "application/fhir+json",
    Accept: "application/fhir+json",
  },
});

// search patient with identifier
export const fhireSearchPatientsByIdentifier = async (identifier) => {
  const result = await fhir.get("/Patient", {
    params: { identifier },
  });
  console.log(result.data);
  console.log(getEntries(result.data));
  return getEntries(result.data);
};

// create Patient with patient data
export const fhireCreatePatient = async (newPatient) => {
  const result = await fhir.post("/Patient", newPatient);
  console.log("test");
  console.log(result);
  console.log("test1");
  console.log(result.data);
  return result.data;
};

export const searchPatients = async (req, res) => {
  const request = `${FHIR_BASE_URL}/Patient?name=von`;
  const result = await fetch(request);
  const bundle = await result.json();
  return res.status(200).json(bundle);
};

const getPatient = async (patientId) => {
  const result = await fetch(
    `https://hapi.fhir.org/baseR4/Patient/${patientId}`,
  );
  return result.json();
};
// const run = async () => {
//   // const searchResult = await searchPatients()
//   const patient = await getPatient('131284146')
//   const appointment = await getAppointment(patient.id)
//   await fs.writeFile('patient.json', JSON.stringify(patient, undefined, 2))
//   await fs.writeFile('appointment.json', JSON.stringify(appointment, undefined, 2))
//   await getPatient()
// }

export const handleNewMedication = (req, res) => {
  // console.log(req.params)
  // console.log(req.query)
  // console.log(req.body.medication)

  // console.log(req.user)
  // if (req.user?.claims?.includes('medication:create')) {
  //   return res.status(401)
  // }

  res.status(201).json({ result: "ok" });
};

const getAppointment = async (patientId) => {
  const result = await fetch(
    `https://hapi.fhir.org/baseR4/Appointment?patient=${patientId}`,
  );
  return result.json();
};
