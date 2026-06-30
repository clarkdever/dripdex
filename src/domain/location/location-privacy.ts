import { createHash } from "node:crypto";

import type { Coordinates, LocationPrivacyMode } from "./location-privacy-types";

export { locationPrivacyValues } from "./location-privacy-types";
export type { Coordinates, LocationPrivacyMode } from "./location-privacy-types";

export type HomeZone = {
  label?: string;
  center: Coordinates;
  publicLocationLabel?: string;
  radiusKm?: number;
};

export type PublicLocationView = {
  privacyMode: LocationPrivacyMode;
  publicLocationLabel: string;
  publicCoordinates: Coordinates | null;
};

export type PublicLocationViewOptions = {
  exactLocation: Coordinates | null;
  publicLocationLabel: string;
  observationSeed: string;
  requestedMode?: LocationPrivacyMode;
  homeZones?: readonly HomeZone[];
  homeZoneMode?: Extract<LocationPrivacyMode, "public_region_only" | "private_location">;
  cellSizeDegrees?: number;
};

export type DerivePublicObscuredLocationOptions = {
  exactLocation: Coordinates;
  observationSeed: string;
  cellSizeDegrees?: number;
};

const earthRadiusKm = 6371;
const defaultCellSizeDegrees = 0.2;
const defaultHomeZoneRadiusKm = 20;
const protectedLocationLabel = "Location protected";

export function createPublicLocationView(
  options: PublicLocationViewOptions
): PublicLocationView {
  const requestedMode = options.requestedMode ?? "public_obscured";
  const exactLocation = options.exactLocation;

  if (!exactLocation) {
    if (requestedMode === "private_location" || requestedMode === "exact_private") {
      return protectedLocation({
        privacyMode: requestedMode,
        publicLocationLabel: protectedLocationLabel
      });
    }

    return protectedLocation({
      privacyMode: "public_region_only",
      publicLocationLabel: options.publicLocationLabel
    });
  }

  if (requestedMode === "private_location" || requestedMode === "exact_private") {
    return protectedLocation({
      privacyMode: requestedMode,
      publicLocationLabel: protectedLocationLabel
    });
  }

  const matchingHomeZone = options.homeZones?.find((homeZone) =>
    isWithinHomeZone(exactLocation, homeZone)
  );
  if (matchingHomeZone) {
    const homeZoneMode = options.homeZoneMode ?? "public_region_only";

    return protectedLocation({
      privacyMode: homeZoneMode,
      publicLocationLabel:
        homeZoneMode === "private_location"
          ? protectedLocationLabel
          : matchingHomeZone.publicLocationLabel ?? options.publicLocationLabel
    });
  }

  switch (requestedMode) {
    case "public_obscured":
      return {
        privacyMode: "public_obscured",
        publicLocationLabel: options.publicLocationLabel,
        publicCoordinates: derivePublicObscuredLocation({
          exactLocation,
          observationSeed: options.observationSeed,
          cellSizeDegrees: options.cellSizeDegrees
        })
      };
    case "public_region_only":
      return protectedLocation({
        privacyMode: "public_region_only",
        publicLocationLabel: options.publicLocationLabel
      });
  }
}

export function derivePublicObscuredLocation(
  options: DerivePublicObscuredLocationOptions
): Coordinates {
  assertCoordinates(options.exactLocation);
  assertObservationSeed(options.observationSeed);

  const cellSizeDegrees = options.cellSizeDegrees ?? defaultCellSizeDegrees;
  if (!Number.isFinite(cellSizeDegrees) || cellSizeDegrees <= 0 || cellSizeDegrees > 180) {
    throw new Error("cellSizeDegrees must be between 0 and 180.");
  }

  const cellSouth = getBoundedCellStart({
    value: options.exactLocation.latitude,
    cellSizeDegrees,
    min: -90,
    max: 90
  });
  const cellWest = getBoundedCellStart({
    value: options.exactLocation.longitude,
    cellSizeDegrees,
    min: -180,
    max: 180
  });
  const hash = createHash("sha256")
    .update(`${options.observationSeed}:${cellSouth}:${cellWest}:${cellSizeDegrees}`)
    .digest();
  const latitude = cellSouth + hashFraction(hash, 0) * cellSizeDegrees;
  const longitude = cellWest + hashFraction(hash, 4) * cellSizeDegrees;

  return {
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude)
  };
}

export function isWithinHomeZone(coordinates: Coordinates, homeZone: HomeZone): boolean {
  assertCoordinates(coordinates);
  assertCoordinates(homeZone.center);

  const radiusKm = homeZone.radiusKm ?? defaultHomeZoneRadiusKm;
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error("homeZone radiusKm must be a positive number.");
  }

  return distanceKm(coordinates, homeZone.center) <= radiusKm;
}

function protectedLocation(options: {
  privacyMode: LocationPrivacyMode;
  publicLocationLabel: string;
}): PublicLocationView {
  return {
    privacyMode: options.privacyMode,
    publicLocationLabel: options.publicLocationLabel,
    publicCoordinates: null
  };
}

function distanceKm(first: Coordinates, second: Coordinates): number {
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function assertCoordinates(coordinates: Coordinates): void {
  if (
    !Number.isFinite(coordinates.latitude) ||
    !Number.isFinite(coordinates.longitude) ||
    coordinates.latitude < -90 ||
    coordinates.latitude > 90 ||
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    throw new Error("Coordinates must include valid latitude and longitude.");
  }
}

function assertObservationSeed(observationSeed: string): void {
  if (!observationSeed.trim()) {
    throw new Error("observationSeed must be a non-empty string.");
  }
}

function hashFraction(bytes: Buffer, offset: number): number {
  return bytes.readUInt32BE(offset) / 0x100000000;
}

function getBoundedCellStart(options: {
  value: number;
  cellSizeDegrees: number;
  min: number;
  max: number;
}): number {
  const cellStart = Math.floor(options.value / options.cellSizeDegrees) * options.cellSizeDegrees;

  return Math.min(Math.max(cellStart, options.min), options.max - options.cellSizeDegrees);
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
