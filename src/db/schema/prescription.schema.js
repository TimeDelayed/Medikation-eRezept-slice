import { nanoid } from "nanoid";
import { Schema } from "mongoose";
import { VALID_CONSENT_DECISIONS } from "../../constants/fhirConstants.js";

// wird benötigt, wenn wir es nicht nach Fhir schicken, da wir sonst keinen Nachweis hätten
const prescriptionSchema = new Schema({
  prescriptionId: {
    type: String,
    required: true,
    default: () => nanoid(),
  },
  medicationRequest: {
    code: String,
    display: String,
  },
  // sanity check
  sentToFhirAt: {
    type: Date,
    required: false,
  },
  //consent
  consent: {
    decision: {
      type: String,
      enum: VALID_CONSENT_DECISIONS,
      required: true,
    },

    fhirConsentId: String,

    decidedAt: Date,
  },
}, { timestamps: true });

export default prescriptionSchema;
