import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Schema } from "mongoose";
import anamnesisSchema from "./anamnesis.schema.js";

//https://mongoosejs.com/docs/guide.html#timeseries
const visitSchema = new Schema({
  visitId: {
    type: String,
    index: true,
    required: true,
    default: nanoid(),
  },
  kv: {
    type: String,
    required: true,
  },
  patientFhirId: {
    type: String,
    required: false,
  },
  //https://stackoverflow.com/questions/29299477/how-to-create-and-use-enum-in-mongoose
  visitStatus: {
    type: String,
    enum : ["started","inProgress", "done"],
    required: true,
    default: "started",
  },
  //consent
  consent: {
    haveConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    fhirConsentId: {
      type: String,
      required: false,
    },
    gotConsentAt: {
      type: Date,
      required: false,
    },
  },
  // anamnesis (übergangsweise zum speichern (löschung,wenn consent nicht vorhanden))
  anamnesis : {
    type: anamnesisSchema,
    required: false,
  },
  // from doctor
  localPrescriptions: [
    {
      code: {
        type: String,
        required: false,
      },
      medication : {
        type: String,
        required: false,
      },
    },
  ],
  // send bundle
  fhirBundleRef: {
    type: String,
    required: false,
  },
}, { timestamps: true });

//https://github.com/Automattic/mongoose/issues/14097
//https://stackoverflow.com/questions/51349764/createindex-in-mongoose
// aufbewahrung von 10 Jahren
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 10 });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
