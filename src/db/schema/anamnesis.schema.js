import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Schema } from "mongoose";

const anamnesisSchema = new Schema({
  anamnesisId: {
    type: String,
    index: true,
    required: true,
    default: () => nanoid(),
  },
  // needs a patient
  patientFhirId: {
    type: String,
    required: true,
  },
  preexistingConditions: [{
    code: String,
    display : String,
  }],
  longTermMedications: [{
    code: String,
    display : String,
  }],
  fhirSubmittedAt: {
    type: Date,
    required: false,
  },
  //consent
  consent: {
    decision: {
      type: String,
      enum: ["permit", "deny"],
      required: true,
    },

    fhirConsentId: String,

    decidedAt: Date,
  },
}, { timestamps: true });

export default anamnesisSchema;
