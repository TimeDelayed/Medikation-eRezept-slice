import mongoose, { Error } from "mongoose";
import { randomUUID } from "node:crypto";
import { Schema } from "mongoose";
import { ResourceType } from "./ressourceType.js";
import { nextSeq } from "./counter.schema.js";

// https://dev.to/mwangikibui/handling-audit-logging-in-nodejs-2j3f
// https://dev.to/williamsgqdev/step-by-step-guide-to-implementing-nodejs-audit-trail-jic
const auditTrail = new Schema({
  entryId: { type: Number, unique: true },
  transactionId:  { type: String, required: true, default: () => randomUUID() },
  actor: {
    userId: {
      type: String,
    },
    userRoles: {
      type: [String],
    },
  },
  // what did he do
  action: {
    type: String,
  },
  // on what ressource did he do it?
  ressourceType: {
    type: String,
    enum: Object.values(ResourceType),
  },
  resourceId: {
    type: String,
  },
  patientRef: {
    type: String,
  },
  visitId: {
    type: String,
  },
  // update Audittrail to contain entitys id if they are created.
  entities: [
    {
      _id: false,
      ressourceType: {
        type: String,
        enum: Object.values(ResourceType),
      },
      resourceId: {
        type: String,
      },
    },
  ],
  url: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

//https://stackoverflow.com/questions/28357965/mongoose-auto-increment
auditTrail.pre("save", async function () {
  if (!this.isNew) {
    return;
  }
  this.entryId = await nextSeq("auditTrail");
});

// zusätzlich beim Audit sperren wir das nachträgliche ändern.
// wir erreichen dass, indem wir in die Query functions eine Middleware hinzufügen und einen Error werfen
//https://mongoosejs.com/docs/middleware.html
/**
 * aggregate
 * bulkWrite
 * countDocuments
 * createCollection
 * deleteMany
 * deleteOne
 * distinct
 * estimatedDocumentCount
 * find
 * findOne
 * findOneAndDelete
 * findOneAndReplace
 * findOneAndUpdate
 * init
 * insertMany
 * replaceOne
 * save
 * updateMany
 * updateOne
 * validate
 */

const queryFunctions = ["updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete"];

queryFunctions.forEach((queryFunction) => {
  auditTrail.pre(queryFunction, function () {
    throw new Error(
      `Audit entries are append-only, '${queryFunction}' is not allowed.`,
    );
  });
});

const AuditTrail = mongoose.model("AuditTrail", auditTrail);

export default AuditTrail;
