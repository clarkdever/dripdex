import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  type Creature,
  creatureStatusValues,
  fixtureManifestSchema,
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

describe("fixture domain schemas", () => {
  it("accepts every existing fixture metadata file", () => {
    const dataset = {
      manifest: readJsonFile(join(metadataRoot, "fixture-manifest.json")),
      creatures: readJsonDirectory("creatures"),
      photos: readJsonDirectory("photos"),
      observations: readJsonDirectory("observations"),
      histories: readJsonDirectory("history")
    };

    const result = validateFixtureDataset(dataset);

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
});
