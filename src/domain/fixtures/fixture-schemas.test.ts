import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  type Creature,
  creatureStatusValues,
  fixtureManifestSchema,
  locationPrivacyValues,
  observationSchema,
  photoSchema,
  validateFixtureDataset
} from "./fixture-schemas";

const metadataRoot = join(process.cwd(), "docs/fixtures/metadata");

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsonDirectory(directory: string): unknown[] {
  const absoluteDirectory = join(metadataRoot, directory);

  return readdirSync(absoluteDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => readJsonFile(join(absoluteDirectory, fileName)));
}

function readFixtureDataset() {
  return {
    manifest: readJsonFile(join(metadataRoot, "fixture-manifest.json")),
    creatures: readJsonDirectory("creatures"),
    photos: readJsonDirectory("photos"),
    observations: readJsonDirectory("observations"),
    histories: readJsonDirectory("history")
  };
}

describe("fixture domain schemas", () => {
  it("accepts every existing fixture metadata file", () => {
    const result = validateFixtureDataset(readFixtureDataset());

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("includes the planned creature status values", () => {
    expect(creatureStatusValues).toEqual([
      "published",
      "draft",
      "hidden",
      "mystery",
      "needs_review"
    ]);
  });

  it("accepts only canonical location privacy values", () => {
    expect(locationPrivacyValues).toEqual([
      "exact_private",
      "public_obscured",
      "public_region_only",
      "private_location"
    ]);

    const observation = readJsonDirectory("observations")[0] as Record<
      string,
      unknown
    >;

    for (const locationPrivacy of locationPrivacyValues) {
      expect(
        observationSchema.safeParse({ ...observation, locationPrivacy }).success
      ).toBe(true);
    }

    expect(
      observationSchema.safeParse({
        ...observation,
        locationPrivacy: "private_exact"
      }).success
    ).toBe(false);
    expect(
      observationSchema.safeParse({
        ...observation,
        locationPrivacy: "obscured"
      }).success
    ).toBe(false);
  });

  it("reports a useful error for a missing default photo reference", () => {
    const manifest = fixtureManifestSchema.parse(
      readJsonFile(join(metadataRoot, "fixture-manifest.json"))
    );
    const [firstCreature] = readJsonDirectory("creatures") as Creature[];
    const creature = {
      ...firstCreature,
      defaultPhotoId: "photo-does-not-exist"
    };

    const result = validateFixtureDataset({
      manifest,
      creatures: [creature],
      photos: readJsonDirectory("photos"),
      observations: readJsonDirectory("observations"),
      histories: readJsonDirectory("history")
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Creature american-snout references missing defaultPhotoId photo-does-not-exist"
    );
  });

  it("reports broken fixture graph references and missing image paths", () => {
    const dataset = readFixtureDataset();
    const [firstCreature] = dataset.creatures as Creature[];
    const brokenCreature = {
      ...firstCreature,
      photoIds: ["photo-does-not-exist"],
      observationIds: ["obs-does-not-exist"],
      historyId: "history-does-not-exist"
    };
    const firstPhoto = (dataset.photos as Array<Record<string, unknown>>).find(
      (photo) => photo.id === "photo-house-finch-001"
    );
    if (!firstPhoto) {
      throw new Error("Expected photo-house-finch-001 fixture");
    }
    const brokenPhoto = {
      ...firstPhoto,
      observationId: "obs-does-not-exist",
      creatureId: "creature-does-not-exist",
      files: {
        ...(firstPhoto.files as Record<string, unknown>),
        card: "docs/fixtures/web-images/does-not-exist.jpg"
      }
    };

    const result = validateFixtureDataset({
      ...dataset,
      creatures: [brokenCreature],
      photos: [brokenPhoto],
      observations: [],
      histories: []
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Creature american-snout references missing photoId photo-does-not-exist",
        "Creature american-snout references missing observationId obs-does-not-exist",
        "Creature american-snout references missing historyId history-does-not-exist",
        "Photo photo-house-finch-001 references missing creatureId creature-does-not-exist",
        "Photo photo-house-finch-001 references missing observationId obs-does-not-exist",
        "Photo photo-house-finch-001 files.card path does not exist: docs/fixtures/web-images/does-not-exist.jpg"
      ])
    );
  });

  it("requires public fixture image EXIF flags to be true", () => {
    const manifest = readJsonFile(
      join(metadataRoot, "fixture-manifest.json")
    ) as Record<string, unknown>;
    const photo = readJsonDirectory("photos")[0] as Record<string, unknown>;

    expect(
      fixtureManifestSchema.safeParse({
        ...manifest,
        publicFixtureImagesExifStripped: false
      }).success
    ).toBe(false);
    expect(
      fixtureManifestSchema.safeParse({
        ...manifest,
        exifTddFixturesUseSyntheticCoordinates: false
      }).success
    ).toBe(false);
    expect(
      photoSchema.safeParse({
        ...photo,
        processing: {
          ...(photo.processing as Record<string, unknown>),
          sourceCopyExifStripped: false
        }
      }).success
    ).toBe(false);
    expect(
      photoSchema.safeParse({
        ...photo,
        processing: {
          ...(photo.processing as Record<string, unknown>),
          webDerivativesExifStripped: false
        }
      }).success
    ).toBe(false);
  });

  it("rejects image paths outside the fixture image roots", () => {
    const dataset = readFixtureDataset();
    const firstPhoto = (dataset.photos as Array<Record<string, unknown>>).find(
      (photo) => photo.id === "photo-american-snout-001"
    );
    if (!firstPhoto) {
      throw new Error("Expected photo-american-snout-001 fixture");
    }

    const result = validateFixtureDataset({
      ...dataset,
      photos: [
        {
          ...firstPhoto,
          files: {
            ...(firstPhoto.files as Record<string, unknown>),
            card: "README.md"
          }
        }
      ]
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Photo photo-american-snout-001 files.card path must be under docs/fixtures/web-images"
    );
  });

  it("rejects normalized subject boxes that extend outside image bounds", () => {
    const photo = readJsonDirectory("photos")[0] as Record<string, unknown>;
    const result = photoSchema.safeParse({
      ...photo,
      subject: {
        subjectPointNormalized: null,
        subjectBoxNormalized: {
          x: 0.75,
          y: 0.75,
          width: 0.5,
          height: 0.5
        },
        source: "user"
      }
    });

    expect(result.success).toBe(false);
  });
});
