import { describe, expect, it } from "vitest";

import { createPrivateMapAdapterViewModel } from "./private-map";

const tileLayer = {
  urlTemplate: "https://tiles.example.test/private/{z}/{x}/{y}.png",
  attribution: "Synthetic tiles",
  minZoom: 4,
  maxZoom: 17
};

const hillCountryObservation = {
  id: "obs-private-map-hill-country-001",
  label: "Synthetic canyon moth",
  category: "insect",
  observedAt: "2026-06-01T12:00:00.000Z",
  locationPrivacy: "public_obscured" as const,
  exactLocation: {
    latitude: 30.222221,
    longitude: -98.111119
  },
  publicObscuredLocation: {
    latitude: 30.4,
    longitude: -98.2
  }
};

const creekObservation = {
  id: "obs-private-map-creek-001",
  label: "Synthetic creek snail",
  category: "mollusk",
  observedAt: "2026-06-02T12:00:00.000Z",
  locationPrivacy: "exact_private" as const,
  exactLocation: {
    latitude: 30.333337,
    longitude: -98.333331
  },
  publicObscuredLocation: null
};

describe("private map adapter", () => {
  it("withholds exact points and heatmap data unless the owner can view exact locations", () => {
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [hillCountryObservation, creekObservation],
      ownerCanViewExactLocations: false,
      tileLayer
    });

    expect(privateMap.access).toBe("owner_required");
    expect(privateMap.exactPoints).toEqual([]);
    expect(privateMap.heatmapPoints).toEqual([]);
    expect(privateMap.privacy).toEqual({
      exactPoints: "owner_only",
      heatmap: "owner_only"
    });

    const serializedMap = JSON.stringify(privateMap);
    expect(serializedMap).not.toContain("30.222221");
    expect(serializedMap).not.toContain("-98.111119");
    expect(serializedMap).not.toContain("30.333337");
    expect(serializedMap).not.toContain("-98.333331");
  });

  it("builds owner-only exact points from private coordinates", () => {
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [hillCountryObservation],
      ownerCanViewExactLocations: true,
      tileLayer
    });

    expect(privateMap.access).toBe("owner");
    expect(privateMap.exactPoints).toEqual([
      {
        id: "obs-private-map-hill-country-001",
        label: "Synthetic canyon moth",
        category: "insect",
        observedAt: "2026-06-01T12:00:00.000Z",
        locationPrivacy: "public_obscured",
        coordinates: hillCountryObservation.exactLocation,
        visibility: "owner_only"
      }
    ]);
  });

  it("uses private fake coordinates for heatmap points instead of public-obscured coordinates", () => {
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [hillCountryObservation, creekObservation],
      ownerCanViewExactLocations: true,
      tileLayer
    });

    expect(privateMap.heatmapPoints).toEqual([
      {
        latitude: 30.222221,
        longitude: -98.111119,
        intensity: 1,
        sourceObservationId: "obs-private-map-hill-country-001",
        visibility: "owner_only"
      },
      {
        latitude: 30.333337,
        longitude: -98.333331,
        intensity: 1,
        sourceObservationId: "obs-private-map-creek-001",
        visibility: "owner_only"
      }
    ]);
    expect(privateMap.heatmapPoints).not.toContainEqual(
      expect.objectContaining(hillCountryObservation.publicObscuredLocation)
    );
  });

  it("keeps tile URL configuration in the adapter view model", () => {
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [],
      ownerCanViewExactLocations: true,
      tileLayer: {
        urlTemplate: "https://maps.example.test/{z}/{x}/{y}.webp",
        attribution: "Configurable map tiles"
      }
    });

    expect(privateMap.tileLayer).toEqual({
      urlTemplate: "https://maps.example.test/{z}/{x}/{y}.webp",
      attribution: "Configurable map tiles"
    });
  });

  it("copies tile URL configuration into the adapter view model", () => {
    const mutableTileLayer = {
      urlTemplate: "https://maps.example.test/original/{z}/{x}/{y}.png",
      attribution: "Original map tiles"
    };
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [],
      ownerCanViewExactLocations: true,
      tileLayer: mutableTileLayer
    });

    mutableTileLayer.urlTemplate = "https://maps.example.test/mutated/{z}/{x}/{y}.png";
    mutableTileLayer.attribution = "Mutated map tiles";

    expect(privateMap.tileLayer).toEqual({
      urlTemplate: "https://maps.example.test/original/{z}/{x}/{y}.png",
      attribution: "Original map tiles"
    });
  });

  it("ignores observations without exact private coordinates", () => {
    const privateMap = createPrivateMapAdapterViewModel({
      observations: [
        {
          ...hillCountryObservation,
          id: "obs-private-map-missing-exact-001",
          exactLocation: null
        }
      ],
      ownerCanViewExactLocations: true,
      tileLayer
    });

    expect(privateMap.exactPoints).toEqual([]);
    expect(privateMap.heatmapPoints).toEqual([]);
  });

  it("rejects invalid private coordinates before building owner-only map layers", () => {
    expect(() =>
      createPrivateMapAdapterViewModel({
        observations: [
          {
            ...hillCountryObservation,
            exactLocation: {
              latitude: Number.NaN,
              longitude: -98.111119
            }
          }
        ],
        ownerCanViewExactLocations: true,
        tileLayer
      })
    ).toThrow("Private map coordinates must include valid latitude and longitude.");

    expect(() =>
      createPrivateMapAdapterViewModel({
        observations: [
          {
            ...hillCountryObservation,
            exactLocation: {
              latitude: 30.222221,
              longitude: -181
            }
          }
        ],
        ownerCanViewExactLocations: true,
        tileLayer
      })
    ).toThrow("Private map coordinates must include valid latitude and longitude.");
  });
});
