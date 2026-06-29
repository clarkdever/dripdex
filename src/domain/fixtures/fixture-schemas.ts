import { existsSync } from "node:fs";
import { join } from "node:path";

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

export const locationPrivacyValues = [
  "exact_private",
  "public_obscured",
  "public_region_only",
  "private_location"
] as const;

export const locationPrivacySchema = z.enum(locationPrivacyValues);

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
    width: z.number().positive().max(1),
    height: z.number().positive().max(1)
  })
  .strict()
  .superRefine((box, context) => {
    if (box.x + box.width > 1) {
      context.addIssue({
        code: "custom",
        message: "subjectBoxNormalized x + width must not exceed 1",
        path: ["width"]
      });
    }

    if (box.y + box.height > 1) {
      context.addIssue({
        code: "custom",
        message: "subjectBoxNormalized y + height must not exceed 1",
        path: ["height"]
      });
    }
  });

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
    locationPrivacy: locationPrivacySchema,
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

function findDuplicateIds(records: Array<{ id: string }>, label: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) {
      duplicates.add(record.id);
    }
    seen.add(record.id);
  }

  return [...duplicates].map((id) => `Duplicate ${label} id ${id}`);
}

function validatePathExists(
  errors: string[],
  owner: string,
  fieldPath: string,
  relativePath: string
) {
  if (!existsSync(join(process.cwd(), relativePath))) {
    errors.push(`${owner} ${fieldPath} path does not exist: ${relativePath}`);
  }
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

  const creaturesById = new Map(
    parsed.data.creatures.map((creature) => [creature.id, creature])
  );
  const photosById = new Map(parsed.data.photos.map((photo) => [photo.id, photo]));
  const observationsById = new Map(
    parsed.data.observations.map((observation) => [observation.id, observation])
  );
  const historiesById = new Map(
    parsed.data.histories.map((history) => [history.id, history])
  );
  const referenceErrors = [
    ...findDuplicateIds(parsed.data.creatures, "creature"),
    ...findDuplicateIds(parsed.data.photos, "photo"),
    ...findDuplicateIds(parsed.data.observations, "observation"),
    ...findDuplicateIds(parsed.data.histories, "history")
  ];

  for (const manifestCreature of parsed.data.manifest.creatures) {
    if (!creaturesById.has(manifestCreature.id)) {
      referenceErrors.push(
        `Manifest references missing creatureId ${manifestCreature.id}`
      );
    }
    validatePathExists(
      referenceErrors,
      `Manifest creature ${manifestCreature.id}`,
      "webImage",
      manifestCreature.webImage
    );
  }

  for (const creature of parsed.data.creatures) {
    if (!photosById.has(creature.defaultPhotoId)) {
      referenceErrors.push(
        `Creature ${creature.id} references missing defaultPhotoId ${creature.defaultPhotoId}`
      );
    }

    for (const photoId of creature.photoIds) {
      if (!photosById.has(photoId)) {
        referenceErrors.push(
          `Creature ${creature.id} references missing photoId ${photoId}`
        );
      }
    }

    for (const observationId of creature.observationIds) {
      if (!observationsById.has(observationId)) {
        referenceErrors.push(
          `Creature ${creature.id} references missing observationId ${observationId}`
        );
      }
    }

    if (!historiesById.has(creature.historyId)) {
      referenceErrors.push(
        `Creature ${creature.id} references missing historyId ${creature.historyId}`
      );
    }
  }

  for (const photo of parsed.data.photos) {
    if (photo.creatureId === null && photo.mysteryId === null) {
      referenceErrors.push(
        `Photo ${photo.id} must reference either creatureId or mysteryId`
      );
    }

    if (photo.creatureId !== null && !creaturesById.has(photo.creatureId)) {
      referenceErrors.push(
        `Photo ${photo.id} references missing creatureId ${photo.creatureId}`
      );
    }

    if (photo.mysteryId !== null && !creaturesById.has(photo.mysteryId)) {
      referenceErrors.push(
        `Photo ${photo.id} references missing mysteryId ${photo.mysteryId}`
      );
    }

    if (!observationsById.has(photo.observationId)) {
      referenceErrors.push(
        `Photo ${photo.id} references missing observationId ${photo.observationId}`
      );
    }

    validatePathExists(
      referenceErrors,
      `Photo ${photo.id}`,
      "files.sourceCopy",
      photo.files.sourceCopy
    );
    validatePathExists(
      referenceErrors,
      `Photo ${photo.id}`,
      "files.full",
      photo.files.full
    );
    validatePathExists(
      referenceErrors,
      `Photo ${photo.id}`,
      "files.card",
      photo.files.card
    );
    validatePathExists(
      referenceErrors,
      `Photo ${photo.id}`,
      "files.thumbnail",
      photo.files.thumbnail
    );
  }

  for (const observation of parsed.data.observations) {
    if (observation.creatureId === null && observation.mysteryId === null) {
      referenceErrors.push(
        `Observation ${observation.id} must reference either creatureId or mysteryId`
      );
    }

    if (
      observation.creatureId !== null &&
      !creaturesById.has(observation.creatureId)
    ) {
      referenceErrors.push(
        `Observation ${observation.id} references missing creatureId ${observation.creatureId}`
      );
    }

    if (
      observation.mysteryId !== null &&
      !creaturesById.has(observation.mysteryId)
    ) {
      referenceErrors.push(
        `Observation ${observation.id} references missing mysteryId ${observation.mysteryId}`
      );
    }

    for (const photoId of observation.photoIds) {
      if (!photosById.has(photoId)) {
        referenceErrors.push(
          `Observation ${observation.id} references missing photoId ${photoId}`
        );
      }
    }
  }

  for (const history of parsed.data.histories) {
    if (!creaturesById.has(history.creatureId)) {
      referenceErrors.push(
        `History ${history.id} references missing creatureId ${history.creatureId}`
      );
    }
  }

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
