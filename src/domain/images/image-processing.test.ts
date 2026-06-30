import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseExifFromFile } from "../exif/exif-parser";
import { generatePublicImageDerivatives } from "./public-derivatives";

const fixtureRoot = process.cwd();
const sourceImageRoot = join(fixtureRoot, "docs/fixtures/source-images");
const exifFixtureRoot = join(fixtureRoot, "tests/fixtures/exif");

async function readSize(filePath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filePath).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Missing dimensions for ${filePath}`);
  }

  return {
    width: metadata.width,
    height: metadata.height
  };
}

async function expectNoEmbeddedMetadata(filePath: string): Promise<void> {
  const metadata = await sharp(filePath).metadata();

  expect(metadata.exif).toBeUndefined();
  expect(metadata.xmp).toBeUndefined();
  expect(metadata.iptc).toBeUndefined();
}

describe("generatePublicImageDerivatives", () => {
  let outputDirectory: string;

  beforeEach(async () => {
    outputDirectory = await mkdtemp(join(tmpdir(), "dripdex-public-derivatives-"));
  });

  afterEach(async () => {
    await rm(outputDirectory, { recursive: true, force: true });
  });

  it("creates configurable full, 20:21 card, and square thumbnail derivatives", async () => {
    const derivatives = await generatePublicImageDerivatives({
      sourcePath: join(sourceImageRoot, "house-finch.jpg"),
      outputDirectory,
      baseName: "house-finch",
      fullMaxDimension: 900
    });

    expect(Object.keys(derivatives)).toEqual(["full", "card", "thumbnail"]);
    expect(await readSize(derivatives.full.path)).toMatchObject({
      width: 900
    });
    expect(await readSize(derivatives.card.path)).toEqual({
      width: 800,
      height: 840
    });
    expect(await readSize(derivatives.thumbnail.path)).toEqual({
      width: 512,
      height: 512
    });
  });

  it("does not enlarge full derivatives beyond the source image", async () => {
    const derivatives = await generatePublicImageDerivatives({
      sourcePath: join(sourceImageRoot, "american-snout.jpg"),
      outputDirectory,
      baseName: "american-snout",
      fullMaxDimension: 1600
    });

    expect(await readSize(derivatives.full.path)).toEqual({
      width: 750,
      height: 500
    });
  });

  it("strips EXIF and GPS metadata from all public derivatives", async () => {
    const derivatives = await generatePublicImageDerivatives({
      sourcePath: join(exifFixtureRoot, "gps-original-fake-home-zone.jpg"),
      outputDirectory,
      baseName: "gps-original-fake-home-zone",
      fullMaxDimension: 1200
    });

    expect(parseExifFromFile(derivatives.full.path)).toMatchObject({
      status: "invalid_exif",
      coordinates: null
    });
    expect(parseExifFromFile(derivatives.card.path)).toMatchObject({
      status: "invalid_exif",
      coordinates: null
    });
    expect(parseExifFromFile(derivatives.thumbnail.path)).toMatchObject({
      status: "invalid_exif",
      coordinates: null
    });

    await expectNoEmbeddedMetadata(derivatives.full.path);
    await expectNoEmbeddedMetadata(derivatives.card.path);
    await expectNoEmbeddedMetadata(derivatives.thumbnail.path);
  });
});
