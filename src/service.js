import express from "express";
import mongoose from "mongoose";
import router from "./routes/index.js";
import Visit from "./db/schema/visit.schema.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger-ui/swagger.js";
import { nanoid } from "nanoid";

//setup
const service = express();
const port = 3000;

// swaggger ui for docu, should TODO: call this AFTER service.use(express.json(), router) and configure swagger auth!
service.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

service.use(express.json(), router);

const main = async () => {
  // https://mongoosejs.com/docs/connections.html
  const db = await mongoose.connect("mongodb://127.0.0.1:27017/fhir");
  console.log("Connected ...");

  service.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

try {
  main();
} catch (e) {
  console.error(e);
}
