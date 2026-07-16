export const schemas = {
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
      name: {
        type: "array",
        items: {
          type: "object",
          properties: {
            use: {
              type: "string",
              enum: [
                "official",
                "usual",
                "temp",
                "nickname",
                "anonymous",
                "old",
                "maiden",
              ],
              example: "official",
            },
            family: {
              type: "string",
              example: "Mustermann",
            },
            given: {
              type: "array",
              items: {
                type: "string",
                example: ["Max", "Karl"],
              },
            },
          },
        },
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
          $ref: "#/components/schemas/AddressCreate",
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
  AddressCreate: {
    type: "object",
    properties: {
      use: {
        type: "string",
        enum: ["home", "work", "temp", "old", "billing"],
        example: "home",
      },
      type: {
        type: "string",
        enum: ["postal", "physical", "both"],
        example: "both",
      },
      text: {
        type: "string",
        example: "Musterstraße 1, 12345 Berlin",
      },
      line: {
        type: "array",
        items: {
          type: "string",
        },
        example: ["Musterstraße 1"],
      },
      city: {
        type: "string",
        example: "Berlin",
      },
      postalCode: {
        type: "string",
        example: "10115",
      },
      district: {
        type: "string",
        example: "Mitte",
      },
      state: {
        type: "string",
        example: "Berlin",
      },
      country: {
        type: "string",
        example: "DE",
      },
    },
  },
};
