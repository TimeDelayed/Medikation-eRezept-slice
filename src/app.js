import express from 'express'
import mongoose from 'mongoose'
import router from "./routes/index.js";
import Patient from './db/schema/Patient.schema.js'
import Visit from './db/schema/visit.schema.js'
import { nanoid } from 'nanoid'

//setup
const app = express()
const port = 3000

app.use(express.json(), router)

const main = async () => {
  // https://mongoosejs.com/docs/connections.html
  const db = await mongoose.connect('mongodb://127.0.0.1:27017/fhir')
  console.log('Connected ...')

  const patient = await Patient.create({birthday: "test", name: "nils"})
  patient.save()
  console.log(patient)

  console.log(nanoid())

  const visit = await Visit.create({ kv: "test", patientId: patient._id, date: new Date()})
  visit.save()
  console.log(visit)

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

try {
  main()
} catch (e) {
  console.error(e)
}
