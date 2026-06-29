import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { isAbsolute, join, normalize } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { createFixtureRepository } from "./fixture-repository";

const projectRoot = process.cwd();
const temporaryMetadataRoots: string[] = [];

function copyJsonDirectory(sourceDirectory: string, destinationDirectory: string) {
  mkdirSync(destinationDirectory, { recursive: true });

  for (const fileName of readdirSync(sourceDirectory)) {
    if (fileName.endsWith(".json")) {
      writeFileSync(
        join(destinationDirectory, fileName),
        readFileSync(join(sourceDirectory, fileName), "utf8")
      );
    }
  }
}

function createMetadataFixtureCopy() {
  const sourceRoot = join(projectRoot, "docs/fixtures/metadata");
  const destinationRoot = mkdtempSync(join(tmpdir(), "dripdex-fixtures-"));

  temporaryMetadataRoots.push(destinationRoot);
  mkdirSync(destinationRoot, { recursive: true });
  writeFileSync(
    join(destinationRoot, "fixture-manifest.json"),
    readFileSync(join(sourceRoot, "fixture-manifest.json"), "utf8")
  );
  copyJsonDirectory(join(sourceRoot, "creatures"), join(destinationRoot, "creatures"));
  copyJsonDirectory(join(sourceRoot, "photos"), join(destinationRoot, "photos"));
  copyJsonDirectory(
    join(sourceRoot, "observations"),
    join(destinationRoot, "observations")
  );
  copyJsonDirectory(join(sourceRoot, "history"), join(destinationRoot, "history"));

  return destinationRoot;
}

describe("fixture repository", () => {
  afterEach(() => {
    for (const metadataRoot of temporaryMetadataRoots.splice(0)) {
      rmSync(metadataRoot, { recursive: true, force: true });
    }
  });

  it("returns every fixture creature with resolved graph records", () => {
    const repository = createFixtureRepository({ projectRoot });

    const creatures = repository.listCreatures();

    expect(creatures).toHaveLength(12);
    expect(creatures.map((record) => record.creature.id).sort()).toEqual([
      "american-snout",
      "devils-cigar",
      "giant-redheaded-centipede",
      "gulf-coast-toad",
      "house-finch",
      "mystery-white-shelf-fungus",
      "texas-bluebonnet",
      "texas-brown-tarantula",
      "texas-prickly-pear",
      "texas-spiny-lizard",
      "western-mosquitofish",
      "white-tailed-deer"
    ]);

    for (const record of creatures) {
      expect(record.defaultPhoto.id).toBe(record.creature.defaultPhotoId);
      expect(record.photos.map((photo) => photo.id)).toEqual(
        record.creature.photoIds
      );
      expect(record.observations.map((observation) => observation.id)).toEqual(
        record.creature.observationIds
      );
      expect(record.history.id).toBe(record.creature.historyId);
    }
  });

  it("returns a creature by ID and DripDex number", () => {
    const repository = createFixtureRepository({ projectRoot });

    const byId = repository.getCreatureById("house-finch");
    const byDripdexNumber = repository.getCreatureByDripdexNumber("001");

    expect(byId?.creature.commonName).toBe("House Finch");
    expect(byDripdexNumber?.creature.id).toBe("house-finch");
    expect(repository.getCreatureById("missing-creature")).toBeNull();
    expect(repository.getCreatureByDripdexNumber("999")).toBeNull();
  });

  it("rejects duplicate DripDex numbers before building lookups", () => {
    const metadataRoot = createMetadataFixtureCopy();
    const creaturePath = join(metadataRoot, "creatures", "american-snout.json");
    const creature = JSON.parse(readFileSync(creaturePath, "utf8")) as Record<
      string,
      unknown
    >;

    writeFileSync(
      creaturePath,
      JSON.stringify({ ...creature, dripdexNumber: "001" }, null, 2)
    );

    expect(() =>
      createFixtureRepository({ metadataRoot, projectRoot })
    ).toThrow("Duplicate DripDex number 001");
  });

  it("returns defensive copies from repository queries", () => {
    const repository = createFixtureRepository({ projectRoot });

    const creatures = repository.listCreatures();
    const firstCreature = creatures[0];
    const expectedHistoryEventCount = firstCreature.history.events.length;
    creatures.pop();
    firstCreature.photos.pop();
    firstCreature.observations.pop();
    firstCreature.publicImagePaths.pop();
    firstCreature.creature.commonName = "Mutated";
    firstCreature.defaultPhoto.files.full = "docs/fixtures/web-images/mutated.jpg";
    firstCreature.history.events.pop();

    const freshCreatures = repository.listCreatures();
    const freshFirstCreature = repository.getCreatureById(firstCreature.creature.id);

    expect(freshCreatures).toHaveLength(12);
    expect(freshFirstCreature?.photos).toHaveLength(
      firstCreature.creature.photoIds.length
    );
    expect(freshFirstCreature?.observations).toHaveLength(
      firstCreature.creature.observationIds.length
    );
    expect(freshFirstCreature?.publicImagePaths.length).toBeGreaterThan(0);
    expect(freshFirstCreature?.creature.commonName).not.toBe("Mutated");
    expect(freshFirstCreature?.defaultPhoto.files.full).not.toBe(
      "docs/fixtures/web-images/mutated.jpg"
    );
    expect(freshFirstCreature?.history.events).toHaveLength(expectedHistoryEventCount);
  });

  it("resolves only existing public web image paths", () => {
    const repository = createFixtureRepository({ projectRoot });

    for (const record of repository.listCreatures()) {
      expect(record.publicImagePaths).toEqual(
        expect.arrayContaining([
          record.defaultPhoto.files.full,
          record.defaultPhoto.files.card,
          record.defaultPhoto.files.thumbnail
        ])
      );

      for (const publicImagePath of record.publicImagePaths) {
        const normalizedPath = normalize(publicImagePath);

        expect(isAbsolute(publicImagePath)).toBe(false);
        expect(normalizedPath.startsWith("docs/fixtures/web-images/")).toBe(true);
        expect(normalizedPath.startsWith("tests/fixtures/exif/")).toBe(false);
        expect(normalizedPath.includes("source-images")).toBe(false);
        expect(existsSync(join(projectRoot, normalizedPath))).toBe(true);
      }
    }
  });
});
