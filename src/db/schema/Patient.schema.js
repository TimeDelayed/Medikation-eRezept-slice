import mongoose from 'mongoose'

import { nanoid } from 'nanoid'

const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    index: true,
    default: nanoid
  },
  timestamp: { type: Number, default: Date.now },
  familyName: { type: String, required: true },
  givenName: [String],
  birthDate: String
})

export default mongoose.model('Patient', PatientSchema)
