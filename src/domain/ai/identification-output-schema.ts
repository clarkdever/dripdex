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

export const openaiIdentificationResultJsonSchema: ProviderResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: {
      type: "string",
      enum: ["dripdex.identification-result.v1"]
    },
    provider: {
      type: "object",
      additionalProperties: false,
      properties: {
        id: { type: "string" },
        model: { type: "string" }
      },
      required: ["id", "model"]
    },
    subjectRegions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          regionId: { type: "string" },
          label: { type: "string" },
          confidence: { type: "number" },
          sourceModel: { type: "string" },
          box: {
            type: "object",
            additionalProperties: false,
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" }
            },
            required: ["x", "y", "width", "height"]
          }
        },
        required: ["regionId", "label", "confidence", "sourceModel", "box"]
      }
    },
    identityCandidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          candidateId: { type: "string" },
          commonName: { type: "string" },
          scientificName: { type: ["string", "null"] },
          confidence: { type: "number" },
          reasoningForOwner: { type: "string" },
          lookalikes: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["candidateId", "commonName", "scientificName", "confidence", "reasoningForOwner", "lookalikes"]
      }
    },
    suggestedCategory: {
      type: "string",
      enum: [
        "bird", "mammal", "reptile", "amphibian", "fish", "insect", "arachnid", "other-invertebrate",
        "flowering-plant", "cactus-succulent", "fungus-lichen", "mystery"
      ]
    },
    suggestedTags: {
      type: "object",
      additionalProperties: false,
      properties: {
        typeTags: {
          type: "array",
          items: {
            type: "string",
            enum: ["Bug", "Dark", "Flying", "Fungi", "Grass", "Ground", "Light", "Mystery", "Normal", "Plant", "Poison", "Water"]
          }
        },
        foodChainTags: {
          type: "array",
          items: {
            type: "string",
            enum: ["Carnivore", "Decomposer", "Herbivore", "Pollinator", "Predator", "Prey", "Producer", "Seed Spreader"]
          }
        },
        seasonality: {
          type: "array",
          items: {
            type: "string",
            enum: ["Spring", "Summer", "Fall", "Winter", "Year Round"]
          }
        },
        safetyLabels: {
          type: "array",
          items: {
            type: "string",
            enum: ["Bites", "Do Not Eat", "Do Not Touch", "Has Thorns", "Keep Distance", "Look Closely", "Poisonous", "Venomous"]
          }
        }
      },
      required: ["typeTags", "foodChainTags", "seasonality", "safetyLabels"]
    },
    safetyNote: { type: ["string", "null"] },
    uncertaintyFlags: {
      type: "array",
      items: {
        type: "string",
        enum: ["blurry_photo", "lookalike_species", "low_detail", "multiple_subjects", "partially_obscured", "season_context_needed", "location_context_needed", "owner_review_needed"]
      }
    },
    citations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          url: { type: "string" }
        },
        required: ["label", "url"]
      }
    },
    notes: { type: ["string", "null"] }
  },
  required: [
    "schemaVersion", "provider", "subjectRegions", "identityCandidates", "suggestedCategory", "suggestedTags",
    "safetyNote", "uncertaintyFlags", "citations", "notes"
  ]
};
