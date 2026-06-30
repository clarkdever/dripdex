import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseExif, parseExifFromFile } from "./exif-parser";

const exifFixtureRoot = join(process.cwd(), "tests/fixtures/exif");
const fixturePaths = {
  fakeHomeZone: join(exifFixtureRoot, "gps-original-fake-home-zone.jpg"),
  noLocation: join(exifFixtureRoot, "gps-original-no-location.jpg"),
  partialLocation: join(exifFixtureRoot, "gps-original-partial-location.jpg")
};

describe("parseExifFromFile", () => {
  it("parses fake Austin GPS coordinates from the synthetic GPS fixture", () => {
    const result = parseExifFromFile(fixturePaths.fakeHomeZone);

    expect(result).toMatchObject({
      status: "ok",
      capturedAtRaw: "2026:06:29 12:00:00",
      camera: {
        make: "DripDex Synthetic Fixture",
        model: "Fake EXIF Test Camera"
      },
      coordinates: {
        latitude: 30.2672,
        longitude: -97.7431
      }
    });
  });

  it("returns no coordinates for a fixture without GPS EXIF", () => {
    expect(() => parseExifFromFile(fixturePaths.noLocation)).not.toThrow();

    expect(parseExifFromFile(fixturePaths.noLocation)).toMatchObject({
      status: "no_coordinates",
      coordinates: null,
      capturedAtRaw: "2026:06:29 12:00:00"
    });
  });

  it("returns a recoverable error state for incomplete GPS EXIF", () => {
    expect(parseExifFromFile(fixturePaths.partialLocation)).toEqual({
      status: "partial_coordinates",
      coordinates: null,
      capturedAtRaw: "2026:06:29 12:00:00",
      camera: {
        make: "DripDex Synthetic Fixture",
        model: "Fake EXIF Test Camera"
      },
      missingGpsFields: ["latitude"],
      error: "Incomplete GPS EXIF coordinates."
    });
  });

  it("returns a recoverable error state for invalid GPS hemisphere refs", () => {
    const bytes = Buffer.from(readFileSync(fixturePaths.fakeHomeZone));
    const latitudeRefEntry = Buffer.from([
      0x00, 0x01, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x4e, 0x00, 0x00, 0x00
    ]);
    const latitudeRefOffset = bytes.indexOf(latitudeRefEntry);
    expect(latitudeRefOffset).toBeGreaterThan(-1);

    bytes[latitudeRefOffset + 8] = 0x58;

    expect(parseExif(bytes)).toMatchObject({
      status: "partial_coordinates",
      coordinates: null,
      missingGpsFields: ["latitude"],
      error: "Incomplete GPS EXIF coordinates."
    });
  });

  it("uses only synthetic EXIF test fixtures", () => {
    expect(Object.values(fixturePaths)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("tests/fixtures/exif/gps-original-fake-home-zone.jpg"),
        expect.stringContaining("tests/fixtures/exif/gps-original-no-location.jpg"),
        expect.stringContaining("tests/fixtures/exif/gps-original-partial-location.jpg")
      ])
    );
    for (const fixturePath of Object.values(fixturePaths)) {
      expect(fixturePath).toContain("tests/fixtures/exif/");
      expect(fixturePath).not.toContain("docs/fixtures/source-images/");
      expect(fixturePath).not.toContain("docs/fixtures/web-images/");
    }
  });
});
