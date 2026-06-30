import { readFileSync } from "node:fs";

export type ExifCamera = {
  make: string | null;
  model: string | null;
};

export type ExifCoordinates = {
  latitude: number;
  longitude: number;
};

export type ExifParseResult =
  | {
      status: "ok";
      coordinates: ExifCoordinates;
      capturedAtRaw: string | null;
      camera: ExifCamera;
    }
  | {
      status: "no_coordinates";
      coordinates: null;
      capturedAtRaw: string | null;
      camera: ExifCamera;
    }
  | {
      status: "partial_coordinates";
      coordinates: null;
      capturedAtRaw: string | null;
      camera: ExifCamera;
      missingGpsFields: string[];
      error: "Incomplete GPS EXIF coordinates.";
    }
  | {
      status: "invalid_exif";
      coordinates: null;
      capturedAtRaw: null;
      camera: ExifCamera;
      error: string;
    };

type Endian = "BE" | "LE";

type TiffContext = {
  bytes: Buffer;
  endian: Endian;
  tiffStart: number;
};

type IfdEntry = {
  tag: number;
  type: number;
  count: number;
  valueOffset: number;
  entryOffset: number;
};

const emptyCamera: ExifCamera = {
  make: null,
  model: null
};

const tag = {
  make: 0x010f,
  model: 0x0110,
  dateTime: 0x0132,
  gpsInfo: 0x8825,
  gpsLatitudeRef: 0x0001,
  gpsLatitude: 0x0002,
  gpsLongitudeRef: 0x0003,
  gpsLongitude: 0x0004
} as const;

const tiffTypeSize = new Map<number, number>([
  [1, 1],
  [2, 1],
  [3, 2],
  [4, 4],
  [5, 8]
]);

export function parseExifFromFile(filePath: string): ExifParseResult {
  return parseExif(readFileSync(filePath));
}

export function parseExif(bytes: Buffer): ExifParseResult {
  try {
    const exifSegment = findExifSegment(bytes);
    if (!exifSegment) {
      return invalidExif("No EXIF segment found.");
    }

    const context = createTiffContext(bytes, exifSegment);
    const firstIfdOffset = readUInt32(context, context.tiffStart + 4);
    const ifd0 = readIfd(context, firstIfdOffset);
    const camera = {
      make: readAsciiEntry(context, ifd0.get(tag.make)),
      model: readAsciiEntry(context, ifd0.get(tag.model))
    };
    const capturedAtRaw = readAsciiEntry(context, ifd0.get(tag.dateTime));
    const gpsInfoEntry = ifd0.get(tag.gpsInfo);

    if (!gpsInfoEntry) {
      return {
        status: "no_coordinates",
        coordinates: null,
        capturedAtRaw,
        camera
      };
    }

    const gpsIfdOffset = readLongEntry(context, gpsInfoEntry);
    if (gpsIfdOffset === null) {
      return partialCoordinates(capturedAtRaw, camera, ["latitude", "longitude"]);
    }

    const gpsIfd = readIfd(context, gpsIfdOffset);
    const latitude = readGpsCoordinate(
      context,
      gpsIfd.get(tag.gpsLatitudeRef),
      gpsIfd.get(tag.gpsLatitude),
      ["N", "S"],
      "S"
    );
    const longitude = readGpsCoordinate(
      context,
      gpsIfd.get(tag.gpsLongitudeRef),
      gpsIfd.get(tag.gpsLongitude),
      ["E", "W"],
      "W"
    );
    if (latitude === null || longitude === null) {
      const missingGpsFields = [
        ...(latitude === null ? ["latitude"] : []),
        ...(longitude === null ? ["longitude"] : [])
      ];
      return partialCoordinates(capturedAtRaw, camera, missingGpsFields);
    }

    return {
      status: "ok",
      coordinates: {
        latitude,
        longitude
      },
      capturedAtRaw,
      camera
    };
  } catch {
    return invalidExif("Unable to parse EXIF metadata.");
  }
}

function findExifSegment(bytes: Buffer): number | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }

    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      return null;
    }

    const segmentLength = bytes.readUInt16BE(offset + 2);
    const segmentStart = offset + 4;
    const segmentEnd = offset + 2 + segmentLength;
    if (segmentLength < 2 || segmentEnd > bytes.length) {
      return null;
    }

    if (marker === 0xe1 && bytes.subarray(segmentStart, segmentStart + 6).equals(Buffer.from("Exif\0\0"))) {
      return segmentStart + 6;
    }

    offset = segmentEnd;
  }

  return null;
}

function createTiffContext(bytes: Buffer, tiffStart: number): TiffContext {
  if (tiffStart + 8 > bytes.length) {
    throw new Error("Invalid TIFF header.");
  }

  const endianMarker = bytes.toString("ascii", tiffStart, tiffStart + 2);
  const endian = endianMarker === "MM" ? "BE" : endianMarker === "II" ? "LE" : null;
  if (!endian) {
    throw new Error("Invalid TIFF byte order.");
  }

  const context: TiffContext = {
    bytes,
    endian,
    tiffStart
  };
  if (readUInt16(context, tiffStart + 2) !== 42) {
    throw new Error("Invalid TIFF magic.");
  }

  return context;
}

function readIfd(context: TiffContext, ifdOffset: number): Map<number, IfdEntry> {
  const ifdStart = context.tiffStart + ifdOffset;
  const entryCount = readUInt16(context, ifdStart);
  const entries = new Map<number, IfdEntry>();

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdStart + 2 + index * 12;
    if (entryOffset + 12 > context.bytes.length) {
      throw new Error("IFD entry is out of bounds.");
    }

    const tagId = readUInt16(context, entryOffset);
    entries.set(tagId, {
      tag: tagId,
      type: readUInt16(context, entryOffset + 2),
      count: readUInt32(context, entryOffset + 4),
      valueOffset: readUInt32(context, entryOffset + 8),
      entryOffset
    });
  }

  return entries;
}

function readAsciiEntry(context: TiffContext, entry: IfdEntry | undefined): string | null {
  const value = readEntryBytes(context, entry);
  if (!value) {
    return null;
  }

  const text = value.toString("ascii").replace(/\0+$/, "").trim();
  return text.length > 0 ? text : null;
}

function readLongEntry(context: TiffContext, entry: IfdEntry | undefined): number | null {
  if (!entry || entry.type !== 4 || entry.count !== 1) {
    return null;
  }

  return entry.valueOffset;
}

function readGpsCoordinate(
  context: TiffContext,
  refEntry: IfdEntry | undefined,
  coordinateEntry: IfdEntry | undefined,
  allowedRefs: [string, string],
  negativeRef: "S" | "W"
): number | null {
  const ref = readAsciiEntry(context, refEntry)?.toUpperCase();
  const values = readRationalEntry(context, coordinateEntry);

  if (!ref || !allowedRefs.includes(ref) || !values || values.length !== 3) {
    return null;
  }

  const absoluteValue = values[0] + values[1] / 60 + values[2] / 3600;
  const signedValue = ref === negativeRef ? -absoluteValue : absoluteValue;
  return roundCoordinate(signedValue);
}

function readRationalEntry(context: TiffContext, entry: IfdEntry | undefined): number[] | null {
  const value = readEntryBytes(context, entry);
  if (!value || !entry || entry.type !== 5 || value.length !== entry.count * 8) {
    return null;
  }

  const valueContext: TiffContext = {
    bytes: value,
    endian: context.endian,
    tiffStart: 0
  };
  const values: number[] = [];
  for (let offset = 0; offset < value.length; offset += 8) {
    const numerator = readUInt32(valueContext, offset);
    const denominator = readUInt32(valueContext, offset + 4);
    if (denominator === 0) {
      return null;
    }
    values.push(numerator / denominator);
  }

  return values;
}

function readEntryBytes(context: TiffContext, entry: IfdEntry | undefined): Buffer | null {
  if (!entry) {
    return null;
  }

  const typeSize = tiffTypeSize.get(entry.type);
  if (!typeSize) {
    return null;
  }

  const byteLength = typeSize * entry.count;
  const valueStart = byteLength <= 4 ? entry.entryOffset + 8 : context.tiffStart + entry.valueOffset;
  const valueEnd = valueStart + byteLength;

  if (byteLength < 0 || valueStart < 0 || valueEnd > context.bytes.length) {
    return null;
  }

  return context.bytes.subarray(valueStart, valueEnd);
}

function readUInt16(context: TiffContext, offset: number): number {
  if (offset + 2 > context.bytes.length) {
    throw new Error("UInt16 read is out of bounds.");
  }

  return context.endian === "BE" ? context.bytes.readUInt16BE(offset) : context.bytes.readUInt16LE(offset);
}

function readUInt32(context: TiffContext, offset: number): number {
  if (offset + 4 > context.bytes.length) {
    throw new Error("UInt32 read is out of bounds.");
  }

  return context.endian === "BE" ? context.bytes.readUInt32BE(offset) : context.bytes.readUInt32LE(offset);
}

function partialCoordinates(
  capturedAtRaw: string | null,
  camera: ExifCamera,
  missingGpsFields: string[]
): ExifParseResult {
  return {
    status: "partial_coordinates",
    coordinates: null,
    capturedAtRaw,
    camera,
    missingGpsFields,
    error: "Incomplete GPS EXIF coordinates."
  };
}

function invalidExif(error: string): ExifParseResult {
  return {
    status: "invalid_exif",
    coordinates: null,
    capturedAtRaw: null,
    camera: emptyCamera,
    error
  };
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
