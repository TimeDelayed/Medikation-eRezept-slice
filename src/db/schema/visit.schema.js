import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Schema } from "mongoose";
import anamnesisSchema from "./anamnesis.schema.js";
import prescriptionSchema from "./prescription.schema.js";
import { VISIT_STATUSES } from "../../constants/fhirConstants.js";

//https://mongoosejs.com/docs/guide.html#timeseries
const visitSchema = new Schema({
  visitId: {
    type: String,
    index: true,
    required: true,
    default: () => nanoid(),
  },
  kvHash: {
    type: String,
    required: false,
  },
  patientInternalIdentifier: {
    type: String,
    required: false,
  },
  patientFhirId: {
    type: String,
    required: true,
  },
  //https://stackoverflow.com/questions/29299477/how-to-create-and-use-enum-in-mongoose
  visitStatus: {
    type: String,
    enum : VISIT_STATUSES,
    required: true,
    default: "started",
  },
  // anamnesis
  anamnesis : {
    type: anamnesisSchema,
    required: false,
    _id: false,
  },
  // from doctor
  prescription : {
    type: prescriptionSchema,
    required: false,
    _id: false,
  },
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
