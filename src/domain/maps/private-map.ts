import type { Coordinates, LocationPrivacyMode } from "../location/location-privacy";

export type PrivateMapTileLayerConfig = {
  /**
   * Public-safe tile URL template for client rendering. Do not embed secrets in this value.
   */
  urlTemplate: string;
  attribution: string;
  minZoom?: number;
  maxZoom?: number;
};

export type PrivateMapObservationInput = {
  id: string;
  label: string;
  category: string;
  observedAt: string | null;
  locationPrivacy: LocationPrivacyMode;
  exactLocation: Coordinates | null;
  publicObscuredLocation: Coordinates | null;
};

export type PrivateMapPoint = {
  id: string;
  label: string;
  category: string;
  observedAt: string | null;
  locationPrivacy: LocationPrivacyMode;
  coordinates: Coordinates;
  visibility: "owner_only";
};

export type PrivateHeatmapPoint = {
  latitude: number;
  longitude: number;
  intensity: number;
  sourceObservationId: string;
  visibility: "owner_only";
};

export type PrivateMapAdapterViewModel = {
  access: "owner" | "owner_required";
  privacy: {
    exactPoints: "owner_only";
    heatmap: "owner_only";
  };
  tileLayer: PrivateMapTileLayerConfig;
  exactPoints: PrivateMapPoint[];
  heatmapPoints: PrivateHeatmapPoint[];
};

export type CreatePrivateMapAdapterViewModelOptions = {
  observations: readonly PrivateMapObservationInput[];
  ownerCanViewExactLocations: boolean;
  tileLayer: PrivateMapTileLayerConfig;
};

export function createPrivateMapAdapterViewModel(
  options: CreatePrivateMapAdapterViewModelOptions
): PrivateMapAdapterViewModel {
  const privacy = {
    exactPoints: "owner_only" as const,
    heatmap: "owner_only" as const
  };

  if (!options.ownerCanViewExactLocations) {
    return {
      access: "owner_required",
      privacy,
      tileLayer: copyTileLayer(options.tileLayer),
      exactPoints: [],
      heatmapPoints: []
    };
  }

  const exactPoints = options.observations.flatMap((observation) => {
    if (!observation.exactLocation) {
      return [];
    }

    return [
      {
        id: observation.id,
        label: observation.label,
        category: observation.category,
        observedAt: observation.observedAt,
        locationPrivacy: observation.locationPrivacy,
        coordinates: copyValidCoordinates(observation.exactLocation),
        visibility: "owner_only" as const
      }
    ];
  });

  return {
    access: "owner",
    privacy,
    tileLayer: copyTileLayer(options.tileLayer),
    exactPoints,
    heatmapPoints: exactPoints.map((point) => ({
      latitude: point.coordinates.latitude,
      longitude: point.coordinates.longitude,
      intensity: 1,
      sourceObservationId: point.id,
      visibility: "owner_only" as const
    }))
  };
}

function copyTileLayer(tileLayer: PrivateMapTileLayerConfig): PrivateMapTileLayerConfig {
  return {
    ...tileLayer
  };
}

function copyValidCoordinates(coordinates: Coordinates): Coordinates {
  if (
    !Number.isFinite(coordinates.latitude) ||
    !Number.isFinite(coordinates.longitude) ||
    coordinates.latitude < -90 ||
    coordinates.latitude > 90 ||
    coordinates.longitude < -180 ||
    coordinates.longitude > 180
  ) {
    throw new Error("Private map coordinates must include valid latitude and longitude.");
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude
  };
}
