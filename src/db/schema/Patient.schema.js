import mongoose from 'mongoose'

import { nanoid } from 'nanoid'

//https://stackoverflow.com/questions/68959108/why-is-this-mongodb-document-being-generated-with-the-same-nanoid
const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    index: true,
    default: nanoid
  },
  name: String,
  birthDate: String
})

const Patient = mongoose.model('Patient', PatientSchema)
export default Patient
