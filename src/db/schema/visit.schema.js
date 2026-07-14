import mongoose from "mongoose";
import { nanoid } from 'nanoid'
import { Schema } from "mongoose";

const visitSchema = new Schema({
  visitId: {
    type: String,
    unique: true,
    index: true,
    required: true,
    default: nanoid
  },
  kv: {
    type: String,
    required: true,
    unique: true,
  },
  patientFhirId: {
    type: String,
    required: false,
  },
  //https://stackoverflow.com/questions/29299477/how-to-create-and-use-enum-in-mongoose
  visitStatus: {
    type: String,
    enum : ['started','inProgress', 'done'],
    required: true,
    default: 'started',
  },
  // from doctor
  localPrescriptions: [
    {
      code: {
        type: string,
        required: false,
      },
      medication : {
        type: string,
        required: false,
      }
    }
],
  consent: {
    haveConsent: {
      type: Boolean,
      required: true,
      default: false
    },
    fhirConsentId: {
      type: String,
      required: false,
    },
    gotConsentAt: {
      type: Date,
      required: false,
    }
  },
  fhirBundleRef: {
    type: String,
    required: false,
  },
  createdAt : {
    required: true,
    default: Date.now(),
  },
}, 'validateBeforeSave', true)

export default visitSchema
