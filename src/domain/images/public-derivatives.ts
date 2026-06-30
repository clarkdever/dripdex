import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

export type PublicImageVariant = "full" | "card" | "thumbnail";

export type PublicImageDerivative = {
  variant: PublicImageVariant;
  path: string;
  width: number;
  height: number;
  size: number;
};

export type PublicImageDerivatives = Record<PublicImageVariant, PublicImageDerivative>;

export type PublicImageDerivativeOptions = {
  sourcePath: string;
  outputDirectory: string;
  baseName: string;
  fullMaxDimension?: number;
  cardWidth?: number;
  cardHeight?: number;
  thumbnailSize?: number;
  quality?: number;
};

const defaultOptions = {
  fullMaxDimension: 1600,
  cardWidth: 800,
  cardHeight: 840,
  thumbnailSize: 512,
  quality: 84
} as const;

export async function generatePublicImageDerivatives(
  options: PublicImageDerivativeOptions
): Promise<PublicImageDerivatives> {
  const config = {
    ...defaultOptions,
    ...options
  };
  const baseName = normalizeBaseName(config.baseName);

  await mkdir(config.outputDirectory, { recursive: true });

  const full = await writeDerivative({
    sourcePath: config.sourcePath,
    outputPath: join(config.outputDirectory, `${baseName}-full.jpg`),
    variant: "full",
    width: config.fullMaxDimension,
    height: config.fullMaxDimension,
    fit: "inside",
    withoutEnlargement: true,
    quality: config.quality
  });
  const card = await writeDerivative({
    sourcePath: config.sourcePath,
    outputPath: join(config.outputDirectory, `${baseName}-card.jpg`),
    variant: "card",
    width: config.cardWidth,
    height: config.cardHeight,
    fit: "cover",
    quality: config.quality
  });
  const thumbnail = await writeDerivative({
    sourcePath: config.sourcePath,
    outputPath: join(config.outputDirectory, `${baseName}-thumb.jpg`),
    variant: "thumbnail",
    width: config.thumbnailSize,
    height: config.thumbnailSize,
    fit: "cover",
    quality: config.quality
  });

  return {
    full,
    card,
    thumbnail
  };
}

type WriteDerivativeOptions = {
  sourcePath: string;
  outputPath: string;
  variant: PublicImageVariant;
  width: number;
  height: number;
  fit: "cover" | "inside";
  withoutEnlargement?: boolean;
  quality: number;
};

async function writeDerivative(options: WriteDerivativeOptions): Promise<PublicImageDerivative> {
  const info = await sharp(options.sourcePath)
    .rotate()
    .resize({
      width: options.width,
      height: options.height,
      fit: options.fit,
      withoutEnlargement: options.withoutEnlargement ?? false
    })
    .jpeg({
      quality: options.quality
    })
    .toFile(options.outputPath);

  return {
    variant: options.variant,
    path: options.outputPath,
    width: info.width,
    height: info.height,
    size: info.size
  };
}

function normalizeBaseName(baseName: string): string {
  const normalized = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new Error("Image derivative baseName must include at least one safe filename character.");
  }

  return normalized;
}
