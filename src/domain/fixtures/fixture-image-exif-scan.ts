import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseExifFromFile, type ExifParseResult } from "../exif/exif-parser";
import type { Photo } from "./fixture-schemas";

export type FixtureImageRole = "sourceCopy" | "full" | "card" | "thumbnail";

export type FixtureImageExifScanOptions = {
  photos: Photo[];
  projectRoot?: string;
};

export type ScannedFixtureImageFile = {
  photoId: string;
  role: FixtureImageRole;
  path: string;
  hasExifSegment: boolean;
  exifStatus: ExifParseResult["status"];
};

export type FixtureImageExifFinding = {
  photoId: string;
  role: FixtureImageRole;
  path: string;
  message: string;
};

export type FixtureImageExifScanResult = {
  scannedFiles: ScannedFixtureImageFile[];
  findings: FixtureImageExifFinding[];
};

const webDerivativeRoles = ["full", "card", "thumbnail"] as const;

export function scanFixturePhotoImageExifSafety(
  options: FixtureImageExifScanOptions
): FixtureImageExifScanResult {
  const projectRoot = options.projectRoot ?? process.cwd();
  const scannedFiles: ScannedFixtureImageFile[] = [];
  const findings: FixtureImageExifFinding[] = [];

  for (const photo of options.photos) {
    const sourceCopy = scanFixtureImageFile({
      projectRoot,
      photoId: photo.id,
      role: "sourceCopy",
      path: photo.files.sourceCopy
    });

    scannedFiles.push(sourceCopy);
    if (containsGpsExif(sourceCopy.exifStatus)) {
      findings.push({
        photoId: sourceCopy.photoId,
        role: sourceCopy.role,
        path: sourceCopy.path,
        message: "Source fixture copy contains GPS EXIF metadata."
      });
    } else if (containsUnreadableExif(sourceCopy)) {
      findings.push({
        photoId: sourceCopy.photoId,
        role: sourceCopy.role,
        path: sourceCopy.path,
        message: "Source fixture copy contains unreadable EXIF metadata."
      });
    }

    for (const role of webDerivativeRoles) {
      const derivative = scanFixtureImageFile({
        projectRoot,
        photoId: photo.id,
        role,
        path: photo.files[role]
      });

      scannedFiles.push(derivative);
      if (containsAnyExif(derivative)) {
        findings.push({
          photoId: derivative.photoId,
          role: derivative.role,
          path: derivative.path,
          message: "Public web derivative contains EXIF metadata."
        });
      }
    }
  }

  return {
    scannedFiles,
    findings
  };
}

export function assertFixtureImagesExifSafe(result: FixtureImageExifScanResult): void {
  if (result.findings.length === 0) {
    return;
  }

  throw new Error(
    [
      "Fixture image EXIF safety scan failed:",
      ...result.findings.map(
        (finding) =>
          `- ${finding.photoId} ${finding.role} ${finding.path}: ${finding.message}`
      )
    ].join("\n")
  );
}

function scanFixtureImageFile(options: {
  projectRoot: string;
  photoId: string;
  role: FixtureImageRole;
  path: string;
}): ScannedFixtureImageFile {
  const filePath = join(options.projectRoot, options.path);
  const bytes = readFileSync(filePath);

  return {
    photoId: options.photoId,
    role: options.role,
    path: options.path,
    hasExifSegment: hasExifSegment(bytes),
    exifStatus: parseExifFromFile(filePath).status
  };
}

function containsGpsExif(status: ExifParseResult["status"]): boolean {
  return status === "ok" || status === "partial_coordinates";
}

function containsUnreadableExif(file: ScannedFixtureImageFile): boolean {
  return file.hasExifSegment && file.exifStatus === "invalid_exif";
}

function containsAnyExif(file: ScannedFixtureImageFile): boolean {
  return file.hasExifSegment;
}

function hasExifSegment(bytes: Buffer): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return false;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      return false;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      return false;
    }

    const segmentLength = bytes.readUInt16BE(offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;
    if (
      marker === 0xe1 &&
      segmentStart + 6 <= bytes.length &&
      bytes.subarray(segmentStart, segmentStart + 6).equals(Buffer.from("Exif\0\0"))
    ) {
      return true;
    }

    if (segmentLength < 2 || segmentEnd > bytes.length) {
      return false;
    }

    offset = segmentEnd;
  }

  return false;
}
