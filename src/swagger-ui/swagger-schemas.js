// Deprecated!
export const schemas = {
  PatientCreate: {
    type: "object",
    required: [
      "kv",
      "insuranceType",
      "familyName",
      "givenNames",
      "birthday",
      "gender",
      "address",
    ],
    properties: {
      kv: {
        type: "string",
        example: "A123456789",
      },
      insuranceType: {
        type: "string",
        enum: ["GKV", "PKV"],
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
      birthday: {
        type: "string",
        format: "date",
        example: "1998-06-15",
      },
      gender: {
        type: "string",
        enum: [
          "male",
          "female",
          "other",
          "unknown",
        ],
      },
      address: {
        oneOf: [
          {
            type: "string",
            example:
            "Musterstraße 1, 12345 Berlin",
          },
          {
            $ref:
            "#/components/schemas/AddressCreate",
          },
        ],
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
