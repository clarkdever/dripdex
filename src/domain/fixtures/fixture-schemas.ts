import { z } from "zod";

const nonEmptyString = z.string().min(1);
const nullableString = z.string().min(1).nullable();
const fixtureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const creatureStatusValues = [
  "published",
  "draft",
  "hidden",
  "mystery",
  "needs_review"
] as const;

export const creatureStatusSchema = z.enum(creatureStatusValues);

export const categorySchema = z.enum([
  "bird",
  "mammal",
  "reptile",
  "amphibian",
  "fish",
  "insect",
  "arachnid",
  "other-invertebrate",
  "flowering-plant",
  "cactus-succulent",
  "fungus-lichen",
  "mystery"
]);

export const publicVisibilitySchema = z.enum(["public", "private", "hidden"]);

export const typeTagSchema = z.enum([
  "Bug",
  "Dark",
  "Flying",
  "Fungi",
  "Grass",
  "Ground",
  "Light",
  "Mystery",
  "Normal",
  "Plant",
  "Poison",
  "Water"
]);

export const foodChainTagSchema = z.enum([
  "Carnivore",
  "Decomposer",
  "Herbivore",
  "Pollinator",
  "Predator",
  "Prey",
  "Producer",
  "Seed Spreader"
]);

export const seasonalitySchema = z.enum([
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "Year Round"
]);

export const safetyLabelSchema = z.enum([
  "Bites",
  "Do Not Eat",
  "Do Not Touch",
  "Has Thorns",
  "Keep Distance",
  "Look Closely",
  "Poisonous",
  "Venomous"
]);

export const rarityRankSchema = z.enum([
  "Common",
  "Uncommon",
  "Rare",
  "Mystery"
]);

const citationSchema = z
  .object({
    label: nonEmptyString,
    url: z.string().url()
  })
  .strict();

export const creatureSchema = z
  .object({
    id: nonEmptyString,
    dripdexNumber: z.string().regex(/^\d{3}$/),
    status: creatureStatusSchema,
    publicVisibility: publicVisibilitySchema,
    needsHumanValidation: z.boolean(),
    commonName: nonEmptyString,
    scientificName: nullableString,
    sourceKnownName: nullableString,
    category: categorySchema,
    displayName: z
      .object({
        generatedNickname: nonEmptyString,
        customName: nullableString
      })
      .strict(),
    defaultPhotoId: nonEmptyString,
    tags: z
      .object({
        typeTags: z.array(typeTagSchema).min(1),
        foodChainTags: z.array(foodChainTagSchema).min(1),
        seasonality: z.array(seasonalitySchema).min(1),
        safetyLabels: z.array(safetyLabelSchema).min(1)
      })
      .strict(),
    rarity: z
      .object({
        rank: rarityRankSchema,
        source: nonEmptyString
      })
      .strict(),
    flavorText: nonEmptyString,
    adultScience: z
      .object({
        summary: nonEmptyString,
        citations: z.array(citationSchema).min(1)
      })
      .strict(),
    variants: z
      .object({
        sex: z.array(z.string()),
        lifeStages: z.array(z.string()),
        plantOrFungusStages: z.array(z.string())
      })
      .strict(),
    photoIds: z.array(nonEmptyString).min(1),
    observationIds: z.array(nonEmptyString).min(1),
    historyId: nonEmptyString
  })
  .strict();

const dimensionsSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  })
  .strict();

const normalizedPointSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1)
  })
  .strict();

const normalizedBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1)
  })
  .strict();

export const photoSchema = z
  .object({
    id: nonEmptyString,
    creatureId: nullableString,
    mysteryId: nullableString,
    observationId: nonEmptyString,
    role: z.enum(["default", "supporting"]),
    status: creatureStatusSchema,
    needsHumanValidation: z.boolean(),
    source: z
      .object({
        sourceHtmlUrl: z.string().url(),
        directImageUrl: z.string().url(),
        license: nonEmptyString,
        author: nonEmptyString,
        sourceCaveat: nonEmptyString,
        accessedAt: fixtureDate
      })
      .strict(),
    files: z
      .object({
        sourceCopy: nonEmptyString,
        full: nonEmptyString,
        card: nonEmptyString,
        thumbnail: nonEmptyString
      })
      .strict(),
    dimensions: z
      .object({
        sourceCopy: dimensionsSchema,
        full: dimensionsSchema,
        card: dimensionsSchema,
        thumbnail: dimensionsSchema
      })
      .strict(),
    processing: z
      .object({
        sourceCopyExifStripped: z.boolean(),
        webDerivativesExifStripped: z.boolean(),
        fullMaxDimensionPx: z.number().int().positive(),
        cardAspectRatio: nonEmptyString,
        thumbnailAspectRatio: nonEmptyString,
        processedAt: fixtureDate
      })
      .strict(),
    subject: z
      .object({
        subjectPointNormalized: normalizedPointSchema.nullable(),
        subjectBoxNormalized: normalizedBoxSchema.nullable(),
        source: z.enum(["not_set_for_fixture", "user", "ai"])
      })
      .strict()
  })
  .strict();

const locationSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  })
  .strict();

export const observationSchema = z
  .object({
    id: nonEmptyString,
    creatureId: nullableString,
    mysteryId: nullableString,
    photoIds: z.array(nonEmptyString).min(1),
    status: creatureStatusSchema,
    captureMethod: z.enum(["fixture_source_image", "upload", "in_app_camera", "field_note"]),
    observedAt: z.string().datetime().nullable(),
    publicLocationLabel: nonEmptyString,
    locationPrivacy: z.enum(["public_region_only", "obscured", "private_exact"]),
    exactLocation: locationSchema.nullable(),
    publicObscuredLocation: locationSchema.nullable(),
    notes: nonEmptyString,
    identification: z
      .object({
        currentCommonName: nullableString,
        currentScientificName: nullableString,
        confidence: z.enum([
          "source_page_identified",
          "ai_high",
          "ai_medium",
          "ai_low",
          "unresolved_fixture",
          "human_verified"
        ]),
        candidateHistory: z.array(z.unknown())
      })
      .strict(),
    needsHumanValidation: z.boolean()
  })
  .strict();

export const historyEventSchema = z
  .object({
    id: nonEmptyString,
    type: z.enum([
      "first_found",
      "photo_added",
      "mystery_created",
      "suggestion_rejected",
      "identity_resolved",
      "note_added"
    ]),
    date: fixtureDate,
    label: nonEmptyString,
    details: nonEmptyString
  })
  .strict();

export const historySchema = z
  .object({
    id: nonEmptyString,
    creatureId: nonEmptyString,
    events: z.array(historyEventSchema).min(1)
  })
  .strict();

const manifestCreatureSchema = z
  .object({
    id: nonEmptyString,
    category: categorySchema,
    commonName: nonEmptyString,
    scientificName: nullableString,
    status: creatureStatusSchema,
    sourceHtmlUrl: z.string().url(),
    license: nonEmptyString,
    author: nonEmptyString,
    webImage: nonEmptyString,
    needsHumanValidation: z.boolean()
  })
  .strict();

export const fixtureManifestSchema = z
  .object({
    fixturePack: nonEmptyString,
    generatedAt: fixtureDate,
    description: nonEmptyString,
    humanValidationRequired: z.boolean(),
    publicFixtureImagesExifStripped: z.boolean(),
    exifTddFixturesUseSyntheticCoordinates: z.boolean(),
    creatures: z.array(manifestCreatureSchema).min(1)
  })
  .strict();

export const fixtureDatasetSchema = z
  .object({
    manifest: fixtureManifestSchema,
    creatures: z.array(creatureSchema),
    photos: z.array(photoSchema),
    observations: z.array(observationSchema),
    histories: z.array(historySchema)
  })
  .strict();

export type Creature = z.infer<typeof creatureSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type History = z.infer<typeof historySchema>;
export type FixtureManifest = z.infer<typeof fixtureManifestSchema>;
export type FixtureDataset = z.infer<typeof fixtureDatasetSchema>;

export type FixtureValidationResult =
  | {
      success: true;
      data: FixtureDataset;
      errors: [];
    }
  | {
      success: false;
      data: null;
      errors: string[];
    };

function formatSchemaErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";

    return `${path}: ${issue.message}`;
  });
}

export function validateFixtureDataset(input: unknown): FixtureValidationResult {
  const parsed = fixtureDatasetSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      data: null,
      errors: formatSchemaErrors(parsed.error)
    };
  }

  const photoIds = new Set(parsed.data.photos.map((photo) => photo.id));
  const referenceErrors = parsed.data.creatures
    .filter((creature) => !photoIds.has(creature.defaultPhotoId))
    .map(
      (creature) =>
        `Creature ${creature.id} references missing defaultPhotoId ${creature.defaultPhotoId}`
    );

  if (referenceErrors.length > 0) {
    return {
      success: false,
      data: null,
      errors: referenceErrors
    };
  }

  return {
    success: true,
    data: parsed.data,
    errors: []
  };
}
