import { describe, expect, it } from "vitest";

import {
  createPublicLocationView,
  derivePublicObscuredLocation,
  isWithinHomeZone
} from "./location-privacy";

const syntheticHomeCoordinates = {
  latitude: 30.123456,
  longitude: -97.987654
};
const syntheticFieldCoordinates = {
  latitude: 30.444444,
  longitude: -98.222222
};
const syntheticHomeZone = {
  label: "Synthetic home zone",
  center: syntheticHomeCoordinates,
  publicLocationLabel: "Central Texas",
  radiusKm: 20
};

describe("location privacy helpers", () => {
  it("keeps exact private coordinates out of public location views", () => {
    const publicLocation = createPublicLocationView({
      exactLocation: syntheticFieldCoordinates,
      publicLocationLabel: "Hays County, TX",
      requestedMode: "public_obscured",
      observationSeed: "obs-synthetic-hill-country-001",
      homeZones: [syntheticHomeZone]
    });

    expect(publicLocation).toMatchObject({
      privacyMode: "public_obscured",
      publicLocationLabel: "Hays County, TX"
    });
    expect(publicLocation.publicCoordinates).not.toBeNull();
    expect(publicLocation.publicCoordinates).not.toEqual(syntheticFieldCoordinates);
    expect("exactLocation" in publicLocation).toBe(false);
    expect("reason" in publicLocation).toBe(false);
  });

  it("defaults home-zone observations to region-only public output", () => {
    const publicLocation = createPublicLocationView({
      exactLocation: syntheticHomeCoordinates,
      publicLocationLabel: "near Austin, TX",
      requestedMode: "public_obscured",
      observationSeed: "obs-synthetic-home-zone-001",
      homeZones: [syntheticHomeZone]
    });

    expect(publicLocation).toEqual({
      privacyMode: "public_region_only",
      publicLocationLabel: "Central Texas",
      publicCoordinates: null
    });
    expect("reason" in publicLocation).toBe(false);
  });

  it("derives deterministic public-obscured points inside the coarse cell", () => {
    const first = derivePublicObscuredLocation({
      exactLocation: syntheticFieldCoordinates,
      observationSeed: "obs-synthetic-hill-country-001"
    });
    const second = derivePublicObscuredLocation({
      exactLocation: syntheticFieldCoordinates,
      observationSeed: "obs-synthetic-hill-country-001"
    });
    const differentSeed = derivePublicObscuredLocation({
      exactLocation: syntheticFieldCoordinates,
      observationSeed: "obs-synthetic-hill-country-002"
    });

    expect(second).toEqual(first);
    expect(differentSeed).not.toEqual(first);
    expect(first).not.toEqual(syntheticFieldCoordinates);
    expect(first.latitude).toBeGreaterThanOrEqual(30.4);
    expect(first.latitude).toBeLessThan(30.6);
    expect(first.longitude).toBeGreaterThanOrEqual(-98.4);
    expect(first.longitude).toBeLessThan(-98.2);
  });

  it("keeps public-obscured points inside valid coordinate bounds at map edges", () => {
    const publicCoordinates = derivePublicObscuredLocation({
      exactLocation: {
        latitude: 90,
        longitude: 180
      },
      observationSeed: "obs-synthetic-map-edge-001"
    });

    expect(publicCoordinates.latitude).toBeLessThanOrEqual(90);
    expect(publicCoordinates.longitude).toBeLessThanOrEqual(180);
    expect(publicCoordinates.latitude).toBeGreaterThanOrEqual(-90);
    expect(publicCoordinates.longitude).toBeGreaterThanOrEqual(-180);
  });

  it("rejects obscuring cells larger than valid latitude bounds", () => {
    expect(() =>
      derivePublicObscuredLocation({
        exactLocation: syntheticFieldCoordinates,
        observationSeed: "obs-synthetic-invalid-cell-001",
        cellSizeDegrees: 181
      })
    ).toThrow("cellSizeDegrees must be between 0 and 180.");
  });

  it("withholds public coordinates for region-only and private-location modes", () => {
    expect(
      createPublicLocationView({
        exactLocation: syntheticFieldCoordinates,
        publicLocationLabel: "Texas Hill Country",
        requestedMode: "public_region_only",
        observationSeed: "obs-synthetic-region-only-001"
      })
    ).toEqual({
      privacyMode: "public_region_only",
      publicLocationLabel: "Texas Hill Country",
      publicCoordinates: null
    });

    expect(
      createPublicLocationView({
        exactLocation: syntheticFieldCoordinates,
        publicLocationLabel: "Texas Hill Country",
        requestedMode: "private_location",
        observationSeed: "obs-synthetic-private-location-001"
      })
    ).toEqual({
      privacyMode: "private_location",
      publicLocationLabel: "Location protected",
      publicCoordinates: null
    });
  });

  it("keeps exact-private observations protected when exact coordinates are absent", () => {
    expect(
      createPublicLocationView({
        exactLocation: null,
        publicLocationLabel: "Texas Hill Country",
        requestedMode: "exact_private",
        observationSeed: "obs-synthetic-exact-private-001"
      })
    ).toEqual({
      privacyMode: "exact_private",
      publicLocationLabel: "Location protected",
      publicCoordinates: null
    });
  });

  it("keeps stricter privacy modes protected inside home zones", () => {
    expect(
      createPublicLocationView({
        exactLocation: syntheticHomeCoordinates,
        publicLocationLabel: "near Austin, TX",
        requestedMode: "exact_private",
        observationSeed: "obs-synthetic-exact-private-home-zone-001",
        homeZones: [syntheticHomeZone]
      })
    ).toEqual({
      privacyMode: "exact_private",
      publicLocationLabel: "Location protected",
      publicCoordinates: null
    });

    expect(
      createPublicLocationView({
        exactLocation: syntheticHomeCoordinates,
        publicLocationLabel: "near Austin, TX",
        requestedMode: "private_location",
        observationSeed: "obs-synthetic-private-location-home-zone-001",
        homeZones: [syntheticHomeZone]
      })
    ).toEqual({
      privacyMode: "private_location",
      publicLocationLabel: "Location protected",
      publicCoordinates: null
    });
  });

  it("checks home-zone distance with fake coordinates only", () => {
    expect(
      isWithinHomeZone(syntheticHomeCoordinates, {
        center: syntheticHomeCoordinates,
        radiusKm: 20
      })
    ).toBe(true);
    expect(
      isWithinHomeZone(syntheticFieldCoordinates, {
        center: syntheticHomeCoordinates,
        radiusKm: 20
      })
    ).toBe(false);
  });
});
