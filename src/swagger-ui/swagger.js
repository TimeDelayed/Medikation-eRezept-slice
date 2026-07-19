import swaggerJsdoc from "swagger-jsdoc";
import { schemas } from "./swagger-schemas.js";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "EasyHealth API",
      version: "1.0.0",
    },
    components: {
      //https://swagger.io/docs/specification/v3_0/authentication/bearer-authentication/
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme : "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ...schemas,
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/controller/*.js"],
};
export default swaggerJsdoc(options);
