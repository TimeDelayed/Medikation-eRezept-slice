import swaggerJsdoc from "swagger-jsdoc";
import { patientSchemas } from "./swagger-schemas.js";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "EasyHealth API",
      version: "1.0.0",
    },
    components: {
      schemas: patientSchemas
    },
  },
  apis: ["./src/routes/*.js", "./src/controller/*.js"],
};

export default swaggerJsdoc(options);