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
  preexistingConditions: [{
    code: String,
    display : String,
    _id: false,
  }],
  longTermMedications: [{
    code: String,
    display : String,
    _id: false,
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
    _id: false,
  },
}, { timestamps: true });

export default anamnesisSchema;
