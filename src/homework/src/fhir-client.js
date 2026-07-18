import fs from "node:fs/promises";

const getPatient = async (patientId) => {
  const result = await fetch(`https://hapi.fhir.org/baseR4/Patient/${patientId}`);
  return result.json();
};

const getAppointment = async (patientId) => {
  const result = await fetch(`https://hapi.fhir.org/baseR4/Appointment?patient=${patientId}`);
  return result.json();
};

const run = async () => {
  const patient = await getPatient("131284146");
  const appointment = await getAppointment(patient.id);
  await fs.writeFile("patient.json", JSON.stringify(patient, undefined, 2));
  await fs.writeFile("appointment.json", JSON.stringify(appointment, undefined, 2));
  await getPatient();
};

run().catch(console.error);
