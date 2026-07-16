export const patientSchemas = {
  PatientCreate: {
    type: "object",
    required: ["kv", "insuranceType", "familyName", "givenNames"],
    properties: {
      kv: {
        type: "string",
        description: "Health insurance identifier (KVNR or PKV identifier).",
        example: "A123456789",
      },
      insuranceType: {
        type: "string",
        enum: ["GKV", "PKV"],
        example: "GKV",
      },
      familyName: {
        type: "string",
        example: "Mustermann",
      },
      givenNames: {
        type: "array",
        items: {
          type: "string",
        },
        example: ["Max", "Karl"],
      },
      gender: {
        type: "string",
        enum: ["male", "female", "other", "unknown"],
        example: "male",
      },
      birthday: {
        type: "string",
        format: "date",
        example: "1998-06-15",
      },
      address: {
        type: "array",
        description: "FHIR Patient.address",
        items: {
          type: "object",
        },
      },
      telecom: {
        type: "array",
        description: "FHIR Patient.telecom",
        items: {
          type: "object",
        },
      },
      maritalStatus: {
        type: "object",
        description: "FHIR CodeableConcept",
      },
      communication: {
        type: "array",
        description: "FHIR Patient.communication",
        items: {
          type: "object",
        },
      },
      contact: {
        type: "array",
        description: "FHIR Patient.contact",
        items: {
          type: "object",
        },
      },
    },
  },
};
