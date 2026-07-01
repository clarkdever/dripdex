type ProviderResponseJsonSchema = {
  additionalProperties: boolean;
  properties: Record<string, unknown>;
  required: string[];
  type: "object";
};

export const dripdexProviderResponseJsonSchema: ProviderResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    responseMode: {
      type: "string",
      enum: ["needs_owner_input", "identification_candidate"]
    },
    question: {
      type: ["string", "null"]
    },
    result: {
      type: ["object", "null"]
    }
  },
  required: ["responseMode", "question", "result"]
};
