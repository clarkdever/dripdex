import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { processTrustedImageUpload } from "./image-processing-boundary";

const projectRoot = process.cwd();
const exifFixtureRoot = join(projectRoot, "tests/fixtures/exif");

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

describe("processTrustedImageUpload", () => {
  let sourceRoot: string;
  let outputRoot: string;

  beforeEach(async () => {
    sourceRoot = await mkdtemp(join(tmpdir(), "dripdex-boundary-source-"));
    outputRoot = await mkdtemp(join(tmpdir(), "dripdex-boundary-output-"));
  });

  afterEach(async () => {
    await rm(sourceRoot, { recursive: true, force: true });
    await rm(outputRoot, { recursive: true, force: true });
  });

  it("processes a trusted source handle and returns public storage keys instead of server paths", async () => {
    const fixtureName = "gps-original-fake-home-zone.jpg";
    const sourceKey = `incoming/${fixtureName}`;
    const fixturePath = join(exifFixtureRoot, fixtureName);
    const sourcePath = join(sourceRoot, sourceKey);

    await mkdir(join(sourceRoot, "incoming"), { recursive: true });
    await writeFile(sourcePath, await readFile(fixturePath));
    const sourceStats = await stat(sourcePath);

    const result = await processTrustedImageUpload({
      roots: {
        sourceRoot,
        publicOutputRoot: outputRoot
      },
      source: {
        key: sourceKey,
        contentType: "image/jpeg",
        sizeBytes: sourceStats.size
      },
      publicOutputPrefix: "public/derivatives/draft-123",
      derivativeBaseName: "Backyard Lizard!"
    });

    expect(result.exif).toMatchObject({
      status: "ok",
      coordinates: {
        latitude: 30.2672,
        longitude: -97.7431
      }
    });
    expect(result.derivatives.full).toMatchObject({
      variant: "full",
      key: "public/derivatives/draft-123/backyard-lizard-full.jpg"
    });
    expect(result.derivatives.card).toMatchObject({
      variant: "card",
      key: "public/derivatives/draft-123/backyard-lizard-card.jpg"
    });
    expect(result.derivatives.thumbnail).toMatchObject({
      variant: "thumbnail",
      key: "public/derivatives/draft-123/backyard-lizard-thumb.jpg"
    });
    expect("path" in result.derivatives.full).toBe(false);
    expect(await readSize(join(outputRoot, result.derivatives.card.key))).toEqual({
      width: 800,
      height: 840
    });
  });

  it("rejects source keys that escape the configured source root", async () => {
    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "../secret.jpg",
          contentType: "image/jpeg",
          sizeBytes: 10
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "secret"
      })
    ).rejects.toThrow("Image source key must stay inside the configured source root.");
  });

  it("rejects source keys that resolve through a symlink outside the configured source root", async () => {
    const sourcePath = join(exifFixtureRoot, "gps-original-no-location.jpg");
    const sourceStats = await stat(sourcePath);
    await symlink(sourcePath, join(sourceRoot, "linked-source.jpg"));

    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "linked-source.jpg",
          contentType: "image/jpeg",
          sizeBytes: sourceStats.size
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "linked-source"
      })
    ).rejects.toThrow("Image source key must stay inside the configured source root.");
  });

  it("rejects public output prefixes that escape the configured output root", async () => {
    const sourcePath = join(sourceRoot, "incoming.jpg");
    await writeFile(sourcePath, await readFile(join(exifFixtureRoot, "gps-original-no-location.jpg")));
    const sourceStats = await stat(sourcePath);

    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "incoming.jpg",
          contentType: "image/jpeg",
          sizeBytes: sourceStats.size
        },
        publicOutputPrefix: "../escaped",
        derivativeBaseName: "incoming"
      })
    ).rejects.toThrow("Public output key must stay inside the configured output root.");
  });

  it("rejects public output prefixes that resolve through a symlink outside the configured output root", async () => {
    const outsideOutputRoot = await mkdtemp(join(tmpdir(), "dripdex-boundary-outside-output-"));
    const sourcePath = join(sourceRoot, "incoming.jpg");
    await writeFile(sourcePath, await readFile(join(exifFixtureRoot, "gps-original-no-location.jpg")));
    const sourceStats = await stat(sourcePath);
    await symlink(outsideOutputRoot, join(outputRoot, "public"));

    try {
      await expect(
        processTrustedImageUpload({
          roots: {
            sourceRoot,
            publicOutputRoot: outputRoot
          },
          source: {
            key: "incoming.jpg",
            contentType: "image/jpeg",
            sizeBytes: sourceStats.size
          },
          publicOutputPrefix: "public/draft-123",
          derivativeBaseName: "incoming"
        })
      ).rejects.toThrow("Public output key must stay inside the configured output root.");
    } finally {
      await expect(stat(join(outsideOutputRoot, "draft-123"))).rejects.toMatchObject({
        code: "ENOENT"
      });
      await rm(outsideOutputRoot, { recursive: true, force: true });
    }
  });

  it("normalizes unexpected filesystem errors without leaking absolute source paths", async () => {
    const missingKey = "missing.jpg";

    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: missingKey,
          contentType: "image/jpeg",
          sizeBytes: 100
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "missing"
      })
    ).rejects.toThrow("Image processing failed before a public-safe result could be created.");

    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: missingKey,
          contentType: "image/jpeg",
          sizeBytes: 100
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "missing"
      })
    ).rejects.not.toThrow(sourceRoot);
  });

  it("rejects oversized files before image decode", async () => {
    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "incoming.jpg",
          contentType: "image/jpeg",
          sizeBytes: 5_000_001
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "incoming",
        maxSourceBytes: 5_000_000
      })
    ).rejects.toThrow("Image source exceeds the configured 5000000 byte limit.");
  });

  it("rejects unsupported declared content types before image decode", async () => {
    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "incoming.txt",
          contentType: "text/plain",
          sizeBytes: 12
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "incoming"
      })
    ).rejects.toThrow("Unsupported image content type: text/plain.");
  });

  it("rejects files whose bytes do not match the declared image type", async () => {
    const sourcePath = join(sourceRoot, "incoming.jpg");
    await writeFile(sourcePath, "not an image");
    const sourceStats = await stat(sourcePath);

    await expect(
      processTrustedImageUpload({
        roots: {
          sourceRoot,
          publicOutputRoot: outputRoot
        },
        source: {
          key: "incoming.jpg",
          contentType: "image/jpeg",
          sizeBytes: sourceStats.size
        },
        publicOutputPrefix: "public/derivatives/draft-123",
        derivativeBaseName: "incoming"
      })
    ).rejects.toThrow("Image source bytes do not match the declared content type.");
  });
});
