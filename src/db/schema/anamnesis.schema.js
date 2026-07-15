import mongoose from "mongoose";
import { nanoid } from 'nanoid'
import { Schema } from "mongoose";

const anamnesisSchema = new Schema({
  anamnesisId: {
    type: String,
    index: true,
    required: true,
    default: nanoid()
  },
  // needs a patient
  patientFhirId: {
    type: String,
    required: true,
  },
  // needs a visitId
  visitId : {
    type: String,
    required: true,
  },
  preexistingConditions: [{
    code: String,
    display : String
  }],
  longTermMedications: [{
    code: String,
    display : String
  }],
  sendToFhir: {
    type: Date,
    required: false
  },
}, { timestamps: true })

export default anamnesisSchema;
