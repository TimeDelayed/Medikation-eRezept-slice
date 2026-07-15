import express from 'express'
import mongoose from 'mongoose'
import router from "./routes/index.js";
import Visit from './db/schema/visit.schema.js'
import { nanoid } from 'nanoid'

//setup
const service = express()
const port = 3000

service.use(express.json(), router)

const main = async () => {
  // https://mongoosejs.com/docs/connections.html
  const db = await mongoose.connect('mongodb://127.0.0.1:27017/fhir')
  console.log('Connected ...')

  const visit = await Visit.create({ kv: "test", patientId: 1, date: new Date()})
  visit.save()
  console.log(visit)

  service.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

try {
  main()
} catch (e) {
  console.error(e)
}
