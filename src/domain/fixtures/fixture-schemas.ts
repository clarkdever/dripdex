import { existsSync } from "node:fs";
import { extname, isAbsolute, join, normalize } from "node:path";

import { z } from "zod";

import { locationPrivacyValues } from "../location/location-privacy-types";
import {
  categorySchema,
  foodChainTagSchema,
  safetyLabelSchema,
  seasonalitySchema,
  typeTagSchema
} from "../taxonomy/taxonomy-schemas";

export { locationPrivacyValues };
export {
  categorySchema,
  foodChainTagSchema,
  safetyLabelSchema,
  seasonalitySchema,
  typeTagSchema
};

const nonEmptyString = z.string().min(1);
const nullableString = z.string().min(1).nullable();
const fixtureDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Expected a real calendar date");
const fixtureImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export const creatureStatusValues = [
  "published",
  "draft",
  "hidden",
  "mystery",
  "needs_review"
] as const;

export const creatureStatusSchema = z.enum(creatureStatusValues);

export const publicVisibilitySchema = z.enum(["public", "private", "hidden"]);

export const locationPrivacySchema = z.enum(locationPrivacyValues);

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
        sourceCopyExifStripped: z.literal(true),
        webDerivativesExifStripped: z.literal(true),
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
    publicFixtureImagesExifStripped: z.literal(true),
    exifTddFixturesUseSyntheticCoordinates: z.literal(true),
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

type FixtureIndex = {
  creaturesById: Map<string, Creature>;
  photosById: Map<string, Photo>;
  observationsById: Map<string, Observation>;
  historiesById: Map<string, History>;
};

type EntryOwner =
  | {
      kind: "creature";
      id: string;
    }
  | {
      kind: "mystery";
      id: string;
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

function validateFixtureImagePath(
  errors: string[],
  owner: string,
  fieldPath: string,
  relativePath: string,
  allowedRoot: string
) {
  const normalizedPath = normalize(relativePath);

  if (
    isAbsolute(relativePath) ||
    normalizedPath.startsWith("..") ||
    !normalizedPath.startsWith(`${allowedRoot}/`)
  ) {
    errors.push(`${owner} ${fieldPath} path must be under ${allowedRoot}`);
    return;
  }

  if (!fixtureImageExtensions.has(extname(normalizedPath).toLowerCase())) {
    errors.push(`${owner} ${fieldPath} path must use a fixture image extension`);
    return;
  }

  if (!existsSync(join(process.cwd(), normalizedPath))) {
    errors.push(`${owner} ${fieldPath} path does not exist: ${relativePath}`);
  }
}

function createFixtureIndex(dataset: FixtureDataset): FixtureIndex {
  return {
    creaturesById: new Map(dataset.creatures.map((creature) => [creature.id, creature])),
    photosById: new Map(dataset.photos.map((photo) => [photo.id, photo])),
    observationsById: new Map(
      dataset.observations.map((observation) => [observation.id, observation])
    ),
    historiesById: new Map(dataset.histories.map((history) => [history.id, history]))
  };
}

function getEntryOwner(
  record: Pick<Photo | Observation, "creatureId" | "mysteryId">
): EntryOwner | null {
  if (record.creatureId !== null && record.mysteryId !== null) {
    return null;
  }

  if (record.creatureId !== null) {
    return {
      kind: "creature",
      id: record.creatureId
    };
  }

  if (record.mysteryId !== null) {
    return {
      kind: "mystery",
      id: record.mysteryId
    };
  }

  return null;
}

function sameOwner(a: EntryOwner, b: EntryOwner) {
  return a.kind === b.kind && a.id === b.id;
}

function ownsEntry(
  record: Pick<Photo | Observation, "creatureId" | "mysteryId">,
  owner: EntryOwner
) {
  const recordOwner = getEntryOwner(record);

  return recordOwner !== null && sameOwner(recordOwner, owner);
}

function describeEntryOwner(owner: EntryOwner | null) {
  if (owner === null) {
    return "no exclusive creatureId or mysteryId";
  }

  return `${owner.kind}Id ${owner.id}`;
}

function validateDuplicates(dataset: FixtureDataset): string[] {
  return [
    ...findDuplicateIds(dataset.creatures, "creature"),
    ...findDuplicateIds(dataset.photos, "photo"),
    ...findDuplicateIds(dataset.observations, "observation"),
    ...findDuplicateIds(dataset.histories, "history")
  ];
}

function validateManifestReferences(
  dataset: FixtureDataset,
  index: FixtureIndex
): string[] {
  const errors: string[] = [];

  for (const manifestCreature of dataset.manifest.creatures) {
    if (!index.creaturesById.has(manifestCreature.id)) {
      errors.push(`Manifest references missing creatureId ${manifestCreature.id}`);
    }
    validateFixtureImagePath(
      errors,
      `Manifest creature ${manifestCreature.id}`,
      "webImage",
      manifestCreature.webImage,
      "docs/fixtures/web-images"
    );
  }

  return errors;
}

function validateCreatureReferences(
  dataset: FixtureDataset,
  index: FixtureIndex
): string[] {
  const errors: string[] = [];

  for (const creature of dataset.creatures) {
    const creatureOwner: EntryOwner = {
      kind: creature.status === "mystery" ? "mystery" : "creature",
      id: creature.id
    };
    const defaultPhoto = index.photosById.get(creature.defaultPhotoId);

    if (!defaultPhoto) {
      errors.push(
        `Creature ${creature.id} references missing defaultPhotoId ${creature.defaultPhotoId}`
      );
    } else {
      if (!creature.photoIds.includes(creature.defaultPhotoId)) {
        errors.push(
          `Creature ${creature.id} defaultPhotoId ${creature.defaultPhotoId} must be listed in its photoIds`
        );
      }
      if (!ownsEntry(defaultPhoto, creatureOwner)) {
        errors.push(
          `Creature ${creature.id} defaultPhotoId ${defaultPhoto.id} belongs to ${describeEntryOwner(getEntryOwner(defaultPhoto))}`
        );
      }
    }

    for (const photoId of creature.photoIds) {
      const photo = index.photosById.get(photoId);

      if (!photo) {
        errors.push(`Creature ${creature.id} references missing photoId ${photoId}`);
      } else if (!ownsEntry(photo, creatureOwner)) {
        errors.push(
          `Creature ${creature.id} photoId ${photo.id} belongs to ${describeEntryOwner(getEntryOwner(photo))}`
        );
      }
    }

    for (const observationId of creature.observationIds) {
      const observation = index.observationsById.get(observationId);

      if (!observation) {
        errors.push(
          `Creature ${creature.id} references missing observationId ${observationId}`
        );
      } else if (!ownsEntry(observation, creatureOwner)) {
        errors.push(
          `Creature ${creature.id} observationId ${observation.id} belongs to ${describeEntryOwner(getEntryOwner(observation))}`
        );
      }
    }

    const history = index.historiesById.get(creature.historyId);
    if (!history) {
      errors.push(
        `Creature ${creature.id} references missing historyId ${creature.historyId}`
      );
    } else if (history.creatureId !== creature.id) {
      errors.push(
        `Creature ${creature.id} historyId ${history.id} belongs to creatureId ${history.creatureId}`
      );
    }
  }

  return errors;
}

function validatePhotoReferences(dataset: FixtureDataset, index: FixtureIndex): string[] {
  const errors: string[] = [];

  for (const photo of dataset.photos) {
    const owner = getEntryOwner(photo);

    if (photo.creatureId === null && photo.mysteryId === null) {
      errors.push(`Photo ${photo.id} must reference either creatureId or mysteryId`);
    }

    if (photo.creatureId !== null && photo.mysteryId !== null) {
      errors.push(`Photo ${photo.id} must not reference both creatureId and mysteryId`);
    }

    if (photo.creatureId !== null && !index.creaturesById.has(photo.creatureId)) {
      errors.push(`Photo ${photo.id} references missing creatureId ${photo.creatureId}`);
    }

    if (photo.mysteryId !== null && !index.creaturesById.has(photo.mysteryId)) {
      errors.push(`Photo ${photo.id} references missing mysteryId ${photo.mysteryId}`);
    }

    const observation = index.observationsById.get(photo.observationId);
    if (!observation) {
      errors.push(
        `Photo ${photo.id} references missing observationId ${photo.observationId}`
      );
    } else if (owner !== null && !ownsEntry(observation, owner)) {
      errors.push(
        `Photo ${photo.id} observationId ${observation.id} belongs to ${describeEntryOwner(getEntryOwner(observation))}`
      );
    }

    if (owner !== null && owner.kind === "creature") {
      const creature = index.creaturesById.get(owner.id);
      if (creature && !creature.photoIds.includes(photo.id)) {
        errors.push(
          `Photo ${photo.id} belongs to creatureId ${owner.id} but is not listed in that creature's photoIds`
        );
      }
    }

    validateFixtureImagePath(
      errors,
      `Photo ${photo.id}`,
      "files.sourceCopy",
      photo.files.sourceCopy,
      "docs/fixtures/source-images"
    );
    validateFixtureImagePath(
      errors,
      `Photo ${photo.id}`,
      "files.full",
      photo.files.full,
      "docs/fixtures/web-images"
    );
    validateFixtureImagePath(
      errors,
      `Photo ${photo.id}`,
      "files.card",
      photo.files.card,
      "docs/fixtures/web-images"
    );
    validateFixtureImagePath(
      errors,
      `Photo ${photo.id}`,
      "files.thumbnail",
      photo.files.thumbnail,
      "docs/fixtures/web-images"
    );
  }

  return errors;
}

function validateObservationReferences(
  dataset: FixtureDataset,
  index: FixtureIndex
): string[] {
  const errors: string[] = [];

  for (const observation of dataset.observations) {
    const owner = getEntryOwner(observation);

    if (observation.creatureId === null && observation.mysteryId === null) {
      errors.push(
        `Observation ${observation.id} must reference either creatureId or mysteryId`
      );
    }

    if (observation.creatureId !== null && observation.mysteryId !== null) {
      errors.push(
        `Observation ${observation.id} must not reference both creatureId and mysteryId`
      );
    }

    if (
      observation.creatureId !== null &&
      !index.creaturesById.has(observation.creatureId)
    ) {
      errors.push(
        `Observation ${observation.id} references missing creatureId ${observation.creatureId}`
      );
    }

    if (
      observation.mysteryId !== null &&
      !index.creaturesById.has(observation.mysteryId)
    ) {
      errors.push(
        `Observation ${observation.id} references missing mysteryId ${observation.mysteryId}`
      );
    }

    for (const photoId of observation.photoIds) {
      const photo = index.photosById.get(photoId);

      if (!photo) {
        errors.push(`Observation ${observation.id} references missing photoId ${photoId}`);
      } else if (photo.observationId !== observation.id) {
        errors.push(
          `Observation ${observation.id} photoId ${photo.id} belongs to observationId ${photo.observationId}`
        );
      } else if (owner !== null && !ownsEntry(photo, owner)) {
        errors.push(
          `Observation ${observation.id} photoId ${photo.id} belongs to ${describeEntryOwner(getEntryOwner(photo))}`
        );
      }
    }

    if (owner !== null && owner.kind === "creature") {
      const creature = index.creaturesById.get(owner.id);
      if (creature && !creature.observationIds.includes(observation.id)) {
        errors.push(
          `Observation ${observation.id} belongs to creatureId ${owner.id} but is not listed in that creature's observationIds`
        );
      }
    }
  }

  return errors;
}

function validateHistoryReferences(dataset: FixtureDataset, index: FixtureIndex): string[] {
  const errors: string[] = [];

  for (const history of dataset.histories) {
    const creature = index.creaturesById.get(history.creatureId);

    if (!creature) {
      errors.push(`History ${history.id} references missing creatureId ${history.creatureId}`);
    } else if (creature.historyId !== history.id) {
      errors.push(
        `History ${history.id} belongs to creatureId ${history.creatureId} but is not referenced by that creature's historyId`
      );
    }
  }

  return errors;
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

  const index = createFixtureIndex(parsed.data);
  const referenceErrors = [
    ...validateDuplicates(parsed.data),
    ...validateManifestReferences(parsed.data, index),
    ...validateCreatureReferences(parsed.data, index),
    ...validatePhotoReferences(parsed.data, index),
    ...validateObservationReferences(parsed.data, index),
    ...validateHistoryReferences(parsed.data, index)
  ];

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
