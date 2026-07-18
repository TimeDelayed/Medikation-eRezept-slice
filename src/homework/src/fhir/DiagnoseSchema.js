import mongoose from "mongoose";

import { Schema } from "mongoose";

const diagnosesSchema = new Schema({
  patientRefId: {
    type: Number,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
});

export default diagnosesSchema;
