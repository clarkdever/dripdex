import { lstat, mkdir, open, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { posix } from "node:path";

import { parseExifFromFile, type ExifParseResult } from "../exif/exif-parser";
import {
  generatePublicImageDerivatives,
  type PublicImageVariant
} from "./public-derivatives";

export type TrustedImageContentType = "image/jpeg" | "image/png" | "image/webp";

export type TrustedImageSourceHandle = {
  key: string;
  contentType: string;
  sizeBytes: number;
};

export type ImageProcessingRoots = {
  sourceRoot: string;
  publicOutputRoot: string;
};

export type ImageProcessingBoundaryOptions = {
  roots: ImageProcessingRoots;
  source: TrustedImageSourceHandle;
  publicOutputPrefix: string;
  derivativeBaseName: string;
  maxSourceBytes?: number;
  allowedContentTypes?: readonly TrustedImageContentType[];
};

export type PublicImageDerivativeReference = {
  variant: PublicImageVariant;
  key: string;
  width: number;
  height: number;
  size: number;
};

type PublicImageDerivativeWithPath = {
  variant: PublicImageVariant;
  path: string;
  width: number;
  height: number;
  size: number;
};

export type TrustedImageProcessingResult = {
  exif: ExifParseResult;
  derivatives: Record<PublicImageVariant, PublicImageDerivativeReference>;
};

const defaultMaxSourceBytes = 12 * 1024 * 1024;
const defaultAllowedContentTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const genericProcessingErrorMessage =
  "Image processing failed before a public-safe result could be created.";

class ImageProcessingBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingBoundaryError";
  }
}

export async function processTrustedImageUpload(
  options: ImageProcessingBoundaryOptions
): Promise<TrustedImageProcessingResult> {
  try {
    return await processTrustedImageUploadUnsafe(options);
  } catch (error) {
    if (error instanceof ImageProcessingBoundaryError) {
      throw error;
    }

    throw new ImageProcessingBoundaryError(genericProcessingErrorMessage);
  }
}

async function processTrustedImageUploadUnsafe(
  options: ImageProcessingBoundaryOptions
): Promise<TrustedImageProcessingResult> {
  const maxSourceBytes = options.maxSourceBytes ?? defaultMaxSourceBytes;
  const allowedContentTypes = options.allowedContentTypes ?? defaultAllowedContentTypes;
  const realSourceRoot = await realpath(options.roots.sourceRoot);
  const realPublicOutputRoot = await realpath(options.roots.publicOutputRoot);
  const sourcePath = resolveKeyInsideRoot({
    root: realSourceRoot,
    key: options.source.key,
    message: "Image source key must stay inside the configured source root."
  });
  const outputDirectory = resolveKeyInsideRoot({
    root: realPublicOutputRoot,
    key: options.publicOutputPrefix,
    message: "Public output key must stay inside the configured output root."
  });

  assertSupportedContentType(options.source.contentType, allowedContentTypes);
  assertWithinSizeLimit(options.source.sizeBytes, maxSourceBytes);

  const realSourcePath = await resolveRealPathInsideRoot({
    root: realSourceRoot,
    targetPath: sourcePath,
    message: "Image source key must stay inside the configured source root."
  });
  const sourceStats = await stat(realSourcePath);
  if (!sourceStats.isFile()) {
    throw new Error("Image source must be a file.");
  }
  assertWithinSizeLimit(sourceStats.size, maxSourceBytes);
  await assertFileSignatureMatchesContentType(realSourcePath, options.source.contentType);

  const realOutputDirectory = await prepareOutputDirectoryInsideRoot({
    root: realPublicOutputRoot,
    targetPath: outputDirectory,
    message: "Public output key must stay inside the configured output root."
  });

  const exif = parseExifFromFile(realSourcePath);
  const derivatives = await generatePublicImageDerivatives({
    sourcePath: realSourcePath,
    outputDirectory: realOutputDirectory,
    baseName: options.derivativeBaseName
  });
  const full = await toDerivativeReference(derivatives.full, realPublicOutputRoot);
  const card = await toDerivativeReference(derivatives.card, realPublicOutputRoot);
  const thumbnail = await toDerivativeReference(derivatives.thumbnail, realPublicOutputRoot);

  return {
    exif,
    derivatives: {
      full,
      card,
      thumbnail
    }
  };
}

function resolveKeyInsideRoot(options: {
  root: string;
  key: string;
  message: string;
}): string {
  if (isAbsolute(options.key)) {
    throw new ImageProcessingBoundaryError(options.message);
  }

  const root = resolve(options.root);
  const resolvedPath = resolve(root, options.key);
  const relativePath = relative(root, resolvedPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new ImageProcessingBoundaryError(options.message);
  }

  return resolvedPath;
}

async function resolveRealPathInsideRoot(options: {
  root: string;
  targetPath: string;
  message: string;
}): Promise<string> {
  const root = resolve(options.root);
  const targetPath = await realpath(options.targetPath);
  const relativePath = relative(root, targetPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new ImageProcessingBoundaryError(options.message);
  }

  return targetPath;
}

async function prepareOutputDirectoryInsideRoot(options: {
  root: string;
  targetPath: string;
  message: string;
}): Promise<string> {
  const root = resolve(options.root);
  const targetPath = resolve(options.targetPath);
  const relativePath = relative(root, targetPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new ImageProcessingBoundaryError(options.message);
  }

  if (relativePath === "") {
    return root;
  }

  let currentPath = root;
  for (const segment of relativePath.split(sep)) {
    currentPath = resolve(currentPath, segment);
    await ensureDirectorySegment(currentPath, options.message);
  }

  return resolveRealPathInsideRoot({
    root,
    targetPath,
    message: options.message
  });
}

async function ensureDirectorySegment(directoryPath: string, message: string): Promise<void> {
  try {
    const stats = await lstat(directoryPath);

    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new ImageProcessingBoundaryError(message);
    }
  } catch (error) {
    if (!isMissingPathError(error)) {
      throw error;
    }

    await mkdir(directoryPath);
  }
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function assertSupportedContentType(
  contentType: string,
  allowedContentTypes: readonly TrustedImageContentType[]
): asserts contentType is TrustedImageContentType {
  if (!allowedContentTypes.includes(contentType as TrustedImageContentType)) {
    throw new ImageProcessingBoundaryError(`Unsupported image content type: ${contentType}.`);
  }
}

function assertWithinSizeLimit(sizeBytes: number, maxSourceBytes: number): void {
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0) {
    throw new ImageProcessingBoundaryError("Image source size must be a non-negative safe integer.");
  }

  if (sizeBytes > maxSourceBytes) {
    throw new ImageProcessingBoundaryError(
      `Image source exceeds the configured ${maxSourceBytes} byte limit.`
    );
  }
}

async function assertFileSignatureMatchesContentType(
  filePath: string,
  contentType: TrustedImageContentType
): Promise<void> {
  const header = await readHeader(filePath, 12);
  const matches =
    (contentType === "image/jpeg" && isJpeg(header)) ||
    (contentType === "image/png" && isPng(header)) ||
    (contentType === "image/webp" && isWebp(header));

  if (!matches) {
    throw new ImageProcessingBoundaryError(
      "Image source bytes do not match the declared content type."
    );
  }
}

async function readHeader(filePath: string, byteLength: number): Promise<Buffer> {
  const file = await open(filePath, "r");

  try {
    const buffer = Buffer.alloc(byteLength);
    const result = await file.read(buffer, 0, byteLength, 0);

    return buffer.subarray(0, result.bytesRead);
  } finally {
    await file.close();
  }
}

function isJpeg(header: Buffer): boolean {
  return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
}

function isPng(header: Buffer): boolean {
  return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isWebp(header: Buffer): boolean {
  return (
    header.length >= 12 &&
    header.subarray(0, 4).equals(Buffer.from("RIFF")) &&
    header.subarray(8, 12).equals(Buffer.from("WEBP"))
  );
}

async function toDerivativeReference(
  derivative: PublicImageDerivativeWithPath,
  publicOutputRoot: string
): Promise<PublicImageDerivativeReference> {
  const root = resolve(publicOutputRoot);
  const derivativePath = await realpath(derivative.path);
  const relativePath = relative(root, derivativePath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new ImageProcessingBoundaryError(
      "Generated derivative path escaped the configured output root."
    );
  }

  return {
    variant: derivative.variant,
    key: relativePath.split(sep).join(posix.sep),
    width: derivative.width,
    height: derivative.height,
    size: derivative.size
  };
}
