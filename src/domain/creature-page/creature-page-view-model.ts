import type { ResolvedFixtureCreature } from "../fixtures/fixture-repository";
import type {
  History,
  Observation,
  Photo,
  locationPrivacyValues
} from "../fixtures/fixture-schemas";

export type CreaturePagePhoto = {
  id: string;
  role: Photo["role"];
  altText: string;
  files: {
    card: string;
    thumbnail: string;
    full: string;
  };
  dimensions: Pick<Photo["dimensions"], "card" | "thumbnail" | "full">;
  source: Photo["source"];
  subject: Photo["subject"];
  needsHumanValidation: boolean;
};

export type CreaturePageTags = {
  type: readonly string[];
  foodChain: readonly string[];
  seasonality: readonly string[];
  safety: readonly string[];
};

export type CreaturePageVariantGroup = {
  key: "sex" | "lifeStages" | "plantOrFungusStages";
  label: string;
  values: readonly string[];
};

export type CreaturePageObservation = {
  id: string;
  status: Observation["status"];
  captureMethod: Observation["captureMethod"];
  observedAtLabel: string | null;
  publicLocationLabel: string;
  locationPrivacy: (typeof locationPrivacyValues)[number];
  hasPublicMapPoint: boolean;
  photoIds: readonly string[];
  identification: {
    commonName: string | null;
    scientificName: string | null;
    confidence: Observation["identification"]["confidence"];
  };
  needsHumanValidation: boolean;
};

export type CreaturePageHistoryEvent = {
  id: string;
  type: History["events"][number]["type"];
  date: string;
  dateLabel: string;
  label: string;
  details: string;
};

export type PublishedCreatureJournalPage = {
  kind: "published-journal";
  id: string;
  dripdexNumber: string;
  status: "published";
  displayName: string;
  commonName: string;
  nickname: string | null;
  scientificName: string | null;
  category: ResolvedFixtureCreature["creature"]["category"];
  defaultPhoto: CreaturePagePhoto;
  carouselPhotos: readonly CreaturePagePhoto[];
  tags: CreaturePageTags;
  rarity: ResolvedFixtureCreature["creature"]["rarity"];
  flavorText: string;
  adultScience: ResolvedFixtureCreature["creature"]["adultScience"];
  safetyNote: string | null;
  variantGroups: readonly CreaturePageVariantGroup[];
  observations: readonly CreaturePageObservation[];
  history: readonly CreaturePageHistoryEvent[];
  ownerNotes: null;
};

export type MysteryCreatureWorkspaceRoute = {
  kind: "mystery-workspace";
  id: string;
  mysteryId: string;
  displayName: string;
  commonName: string;
  sourceKnownName: string | null;
  defaultPhoto: Pick<CreaturePagePhoto, "id" | "altText" | "files">;
  workspaceHref: string;
  reason: "Mystery entries resolve in the mystery investigation workspace.";
};

export type NotPublicCreaturePage = {
  kind: "not-public";
  id: string;
  status: ResolvedFixtureCreature["creature"]["status"];
  publicVisibility: ResolvedFixtureCreature["creature"]["publicVisibility"];
  reason: "Creature journal is not public.";
};

export type CreaturePageViewModel =
  | PublishedCreatureJournalPage
  | MysteryCreatureWorkspaceRoute
  | NotPublicCreaturePage;

function getDisplayName(record: ResolvedFixtureCreature) {
  const { creature } = record;

  return creature.displayName.customName ?? creature.displayName.generatedNickname;
}

function createPhotoViewModel(
  photo: Photo,
  altText: string
): CreaturePagePhoto {
  return {
    id: photo.id,
    role: photo.role,
    altText,
    files: {
      card: photo.files.card,
      thumbnail: photo.files.thumbnail,
      full: photo.files.full
    },
    dimensions: {
      card: photo.dimensions.card,
      thumbnail: photo.dimensions.thumbnail,
      full: photo.dimensions.full
    },
    source: photo.source,
    subject: photo.subject,
    needsHumanValidation: photo.needsHumanValidation
  };
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(date));
}

function formatObservedAtLabel(observedAt: string | null) {
  return observedAt ? formatDateLabel(observedAt) : null;
}

function createVariantGroups(
  variants: ResolvedFixtureCreature["creature"]["variants"]
): CreaturePageVariantGroup[] {
  const groups = [
    {
      key: "sex",
      label: "Sex",
      values: variants.sex
    },
    {
      key: "lifeStages",
      label: "Life Stages",
      values: variants.lifeStages
    },
    {
      key: "plantOrFungusStages",
      label: "Plant/Fungus Stages",
      values: variants.plantOrFungusStages
    }
  ] satisfies readonly CreaturePageVariantGroup[];

  return groups.filter((group) => group.values.length > 0);
}

function createObservationViewModel(
  observation: Observation
): CreaturePageObservation {
  return {
    id: observation.id,
    status: observation.status,
    captureMethod: observation.captureMethod,
    observedAtLabel: formatObservedAtLabel(observation.observedAt),
    publicLocationLabel: observation.publicLocationLabel,
    locationPrivacy: observation.locationPrivacy,
    hasPublicMapPoint: observation.publicObscuredLocation !== null,
    photoIds: [...observation.photoIds],
    identification: {
      commonName: observation.identification.currentCommonName,
      scientificName: observation.identification.currentScientificName,
      confidence: observation.identification.confidence
    },
    needsHumanValidation: observation.needsHumanValidation
  };
}

function createHistoryEventViewModel(
  event: History["events"][number]
): CreaturePageHistoryEvent {
  return {
    id: event.id,
    type: event.type,
    date: event.date,
    dateLabel: formatDateLabel(event.date),
    label: event.label,
    details: event.details
  };
}

function createSafetyNote(safetyLabels: readonly string[]) {
  if (safetyLabels.length === 0) {
    return null;
  }

  return `Observe safely: ${safetyLabels.join(", ")}.`;
}

function buildMysteryWorkspaceRoute(
  record: ResolvedFixtureCreature
): MysteryCreatureWorkspaceRoute {
  const displayName = getDisplayName(record);
  const defaultPhoto = createPhotoViewModel(record.defaultPhoto, displayName);

  return {
    kind: "mystery-workspace",
    id: record.creature.id,
    mysteryId: record.creature.id,
    displayName,
    commonName: record.creature.commonName,
    sourceKnownName: record.creature.sourceKnownName,
    defaultPhoto: {
      id: defaultPhoto.id,
      altText: defaultPhoto.altText,
      files: defaultPhoto.files
    },
    workspaceHref: `/mysteries/${record.creature.id}`,
    reason: "Mystery entries resolve in the mystery investigation workspace."
  };
}

export function buildCreaturePageViewModel(
  record: ResolvedFixtureCreature
): CreaturePageViewModel {
  const { creature } = record;
  const displayName = getDisplayName(record);

  if (creature.publicVisibility !== "public") {
    return {
      kind: "not-public",
      id: creature.id,
      status: creature.status,
      publicVisibility: creature.publicVisibility,
      reason: "Creature journal is not public."
    };
  }
  if (creature.status === "mystery") {
    return buildMysteryWorkspaceRoute(record);
  }
  if (creature.status !== "published") {
    return {
      kind: "not-public",
      id: creature.id,
      status: creature.status,
      publicVisibility: creature.publicVisibility,
      reason: "Creature journal is not public."
    };
  }

  return {
    kind: "published-journal",
    id: creature.id,
    dripdexNumber: creature.dripdexNumber,
    status: creature.status,
    displayName,
    commonName: creature.commonName,
    nickname: creature.displayName.generatedNickname,
    scientificName: creature.scientificName,
    category: creature.category,
    defaultPhoto: createPhotoViewModel(record.defaultPhoto, creature.commonName),
    carouselPhotos: record.photos.map((photo) =>
      createPhotoViewModel(photo, creature.commonName)
    ),
    tags: {
      type: [...creature.tags.typeTags],
      foodChain: [...creature.tags.foodChainTags],
      seasonality: [...creature.tags.seasonality],
      safety: [...creature.tags.safetyLabels]
    },
    rarity: creature.rarity,
    flavorText: creature.flavorText,
    adultScience: creature.adultScience,
    safetyNote: createSafetyNote(creature.tags.safetyLabels),
    variantGroups: createVariantGroups(creature.variants),
    observations: record.observations.map(createObservationViewModel),
    history: record.history.events.map(createHistoryEventViewModel),
    ownerNotes: null
  };
}
