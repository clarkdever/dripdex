import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Photo } from "./fixture-schemas";
import {
  assertFixtureImagesExifSafe,
  scanFixturePhotoImageExifSafety
} from "./fixture-image-exif-scan";

const projectRoot = process.cwd();
const metadataRoot = join(projectRoot, "docs/fixtures/metadata");
const exifFixtureRoot = join(projectRoot, "tests/fixtures/exif");

async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function readFixturePhotos(): Promise<Photo[]> {
  const photoFileNames = (await readdir(join(metadataRoot, "photos")))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  return Promise.all(
    photoFileNames.map((fileName) =>
      readJsonFile<Photo>(join(metadataRoot, "photos", fileName))
    )
  );
}

function createPhotoWithFiles(files: Photo["files"]): Photo {
  return {
    id: "photo-test-001",
    creatureId: "test-creature",
    mysteryId: null,
    observationId: "obs-test-001",
    role: "default",
    status: "published",
    needsHumanValidation: true,
    source: {
      sourceHtmlUrl: "https://example.com/source",
      directImageUrl: "https://example.com/source.jpg",
      license: "Test",
      author: "Test",
      sourceCaveat: "Test fixture.",
      accessedAt: "2026-06-29"
    },
    files,
    dimensions: {
      sourceCopy: {
        width: 1,
        height: 1
      },
      full: {
        width: 1,
        height: 1
      },
      card: {
        width: 1,
        height: 1
      },
      thumbnail: {
        width: 1,
        height: 1
      }
    },
    processing: {
      sourceCopyExifStripped: true,
      webDerivativesExifStripped: true,
      fullMaxDimensionPx: 1600,
      cardAspectRatio: "20:21",
      thumbnailAspectRatio: "1:1",
      processedAt: "2026-06-29"
    },
    subject: {
      subjectPointNormalized: null,
      subjectBoxNormalized: null,
      source: "not_set_for_fixture"
    }
  };
}

function createMalformedExifJpeg(): Buffer {
  const payload = Buffer.from("Exif\0\0not-a-valid-tiff", "binary");
  const segmentLength = Buffer.alloc(2);
  segmentLength.writeUInt16BE(payload.length + 2);

  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
    segmentLength,
    payload,
    Buffer.from([0xff, 0xd9])
  ]);
}

function createTruncatedExifJpeg(): Buffer {
  const payload = Buffer.from("Exif\0\0short", "binary");
  const segmentLength = Buffer.alloc(2);
  segmentLength.writeUInt16BE(200);

  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
    segmentLength,
    payload
  ]);
}

describe("scanFixturePhotoImageExifSafety", () => {
  let temporaryProjectRoot: string;

  beforeEach(async () => {
    temporaryProjectRoot = await mkdtemp(join(tmpdir(), "dripdex-fixture-exif-scan-"));
    await mkdir(join(temporaryProjectRoot, "docs/fixtures/source-images"), {
      recursive: true
    });
    await mkdir(join(temporaryProjectRoot, "docs/fixtures/web-images"), {
      recursive: true
    });
  });

  afterEach(async () => {
    await rm(temporaryProjectRoot, { recursive: true, force: true });
  });

  it("accepts every image referenced by fixture photo metadata and excludes synthetic EXIF TDD fixtures", async () => {
    const photos = await readFixturePhotos();
    const result = scanFixturePhotoImageExifSafety({
      photos,
      projectRoot
    });

    expect(result.findings).toEqual([]);
    expect(result.scannedFiles).toHaveLength(photos.length * 4);
    expect(result.scannedFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          photoId: "photo-texas-spiny-lizard-001",
          role: "sourceCopy",
          path: "docs/fixtures/source-images/texas-spiny-lizard.jpg"
        }),
        expect.objectContaining({
          photoId: "photo-texas-spiny-lizard-001",
          role: "card",
          path: "docs/fixtures/web-images/texas-spiny-lizard-card.jpg"
        })
      ])
    );
    expect(result.scannedFiles.map((file) => file.path)).not.toEqual(
      expect.arrayContaining([expect.stringContaining("tests/fixtures/exif")])
    );
    expect(() => assertFixtureImagesExifSafe(result)).not.toThrow();
  });

  it("reports GPS metadata in source fixture copies", async () => {
    const sourcePath = "docs/fixtures/source-images/source-with-gps.jpg";
    const webPath = "docs/fixtures/web-images/no-exif-web.jpg";
    const noExifWebBytes = await readFile(
      join(projectRoot, "docs/fixtures/web-images/texas-spiny-lizard-card.jpg")
    );
    await writeFile(
      join(temporaryProjectRoot, sourcePath),
      await readFile(join(exifFixtureRoot, "gps-original-fake-home-zone.jpg"))
    );
    await writeFile(join(temporaryProjectRoot, webPath), noExifWebBytes);

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "sourceCopy",
        path: sourcePath,
        message: "Source fixture copy contains GPS EXIF metadata."
      }
    ]);
    expect(() => assertFixtureImagesExifSafe(result)).toThrow(
      "Source fixture copy contains GPS EXIF metadata."
    );
  });

  it("reports any EXIF metadata in public web derivatives", async () => {
    const sourcePath = "docs/fixtures/source-images/source-no-gps.jpg";
    const webPath = "docs/fixtures/web-images/web-with-camera-exif.jpg";
    await writeFile(
      join(temporaryProjectRoot, sourcePath),
      await readFile(join(exifFixtureRoot, "gps-original-no-location.jpg"))
    );
    await writeFile(
      join(temporaryProjectRoot, webPath),
      await readFile(join(exifFixtureRoot, "gps-original-no-location.jpg"))
    );

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "full",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "card",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "thumbnail",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      }
    ]);
    expect(() => assertFixtureImagesExifSafe(result)).toThrow(
      "Public web derivative contains EXIF metadata."
    );
  });

  it("reports malformed EXIF metadata in public web derivatives", async () => {
    const sourcePath = "docs/fixtures/source-images/source-no-exif.jpg";
    const webPath = "docs/fixtures/web-images/web-with-malformed-exif.jpg";
    await writeFile(
      join(temporaryProjectRoot, sourcePath),
      await readFile(join(projectRoot, "docs/fixtures/web-images/texas-spiny-lizard-card.jpg"))
    );
    await writeFile(join(temporaryProjectRoot, webPath), createMalformedExifJpeg());

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "full",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "card",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "thumbnail",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      }
    ]);
  });

  it("reports truncated EXIF metadata in public web derivatives", async () => {
    const sourcePath = "docs/fixtures/source-images/source-no-exif.jpg";
    const webPath = "docs/fixtures/web-images/web-with-truncated-exif.jpg";
    await writeFile(
      join(temporaryProjectRoot, sourcePath),
      await readFile(join(projectRoot, "docs/fixtures/web-images/texas-spiny-lizard-card.jpg"))
    );
    await writeFile(join(temporaryProjectRoot, webPath), createTruncatedExifJpeg());

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "full",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "card",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      },
      {
        photoId: "photo-test-001",
        role: "thumbnail",
        path: webPath,
        message: "Public web derivative contains EXIF metadata."
      }
    ]);
  });

  it("reports truncated EXIF metadata in source fixture copies", async () => {
    const sourcePath = "docs/fixtures/source-images/source-with-truncated-exif.jpg";
    const webPath = "docs/fixtures/web-images/no-exif-web.jpg";
    await writeFile(join(temporaryProjectRoot, sourcePath), createTruncatedExifJpeg());
    await writeFile(
      join(temporaryProjectRoot, webPath),
      await readFile(join(projectRoot, "docs/fixtures/web-images/texas-spiny-lizard-card.jpg"))
    );

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "sourceCopy",
        path: sourcePath,
        message: "Source fixture copy contains unreadable EXIF metadata."
      }
    ]);
  });

  it("reports unreadable EXIF metadata in source fixture copies", async () => {
    const sourcePath = "docs/fixtures/source-images/source-with-malformed-exif.jpg";
    const webPath = "docs/fixtures/web-images/no-exif-web.jpg";
    await writeFile(join(temporaryProjectRoot, sourcePath), createMalformedExifJpeg());
    await writeFile(
      join(temporaryProjectRoot, webPath),
      await readFile(join(projectRoot, "docs/fixtures/web-images/texas-spiny-lizard-card.jpg"))
    );

    const result = scanFixturePhotoImageExifSafety({
      photos: [
        createPhotoWithFiles({
          sourceCopy: sourcePath,
          full: webPath,
          card: webPath,
          thumbnail: webPath
        })
      ],
      projectRoot: temporaryProjectRoot
    });

    expect(result.findings).toEqual([
      {
        photoId: "photo-test-001",
        role: "sourceCopy",
        path: sourcePath,
        message: "Source fixture copy contains unreadable EXIF metadata."
      }
    ]);
  });
});
