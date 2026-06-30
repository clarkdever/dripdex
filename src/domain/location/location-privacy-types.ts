export const locationPrivacyValues = [
  "exact_private",
  "public_obscured",
  "public_region_only",
  "private_location"
] as const;

export type LocationPrivacyMode = (typeof locationPrivacyValues)[number];

export type Coordinates = {
  latitude: number;
  longitude: number;
};
