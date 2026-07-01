import type { ResolvedFixtureCreature } from "../fixtures/fixture-repository";
import type { Creature, creatureStatusValues } from "../fixtures/fixture-schemas";

export type CollectionCategory = Creature["category"];
export type CollectionStatus = (typeof creatureStatusValues)[number] | "locked";
export type CollectionTreatment =
  | "published"
  | "mystery"
  | "draft"
  | "locked"
  | "favorite"
  | "new";
export type CollectionChecklistState = "found" | "unseeded" | "locked" | "none";

export type LockedCollectionCardInput = {
  id: string;
  dripdexNumber?: string;
  category: CollectionCategory;
  commonName?: string;
  displayName?: string;
  scientificName?: string | null;
  nickname?: string | null;
};

export type BuildCollectionViewModelOptions = {
  favoriteCreatureIds?: readonly string[];
  newCreatureIds?: readonly string[];
  checklistCreatureIds?: readonly string[];
  lockedCards?: readonly LockedCollectionCardInput[];
};

export type CollectionCardImage = {
  card: string;
  thumbnail: string;
  full: string;
};

export type CollectionCard = {
  id: string;
  href: string | null;
  dripdexNumber: string | null;
  category: CollectionCategory;
  categoryLabel: string;
  categoryGroupKey: string;
  commonName: string;
  displayName: string;
  scientificName: string | null;
  nickname: string | null;
  status: CollectionStatus;
  treatments: readonly CollectionTreatment[];
  checklistState: CollectionChecklistState;
  image: CollectionCardImage | null;
  typeTags: readonly string[];
  foodChainTags: readonly string[];
  seasonality: readonly string[];
  safetyLabels: readonly string[];
  rarity: string | null;
  seenCount: number;
  lastSeenLabel: string | null;
  lastSeenMonth: string | null;
  lastSeenSeason: string | null;
  publicLocationLabel: string | null;
  needsHumanValidation: boolean;
  isFavorite: boolean;
  isNew: boolean;
  isLocked: boolean;
  isMystery: boolean;
  isDraft: boolean;
  isPublished: boolean;
};

export type CollectionGroup = {
  key: string;
  label: string;
  categories: readonly CollectionCategory[];
  cards: readonly CollectionCard[];
};

export type CollectionProgress = {
  found: number;
  total: number;
};

export type CollectionViewModel = {
  cards: readonly CollectionCard[];
  groups: readonly CollectionGroup[];
  favorites: readonly CollectionCard[];
  progress: CollectionProgress;
};

type CategoryGroupDefinition = {
  key: string;
  label: string;
  categories: readonly CollectionCategory[];
};

const categoryGroups = [
  { key: "birds", label: "Birds", categories: ["bird"] },
  { key: "mammals", label: "Mammals", categories: ["mammal"] },
  { key: "reptiles", label: "Reptiles", categories: ["reptile"] },
  { key: "amphibians", label: "Amphibians", categories: ["amphibian"] },
  { key: "fish", label: "Fish", categories: ["fish"] },
  { key: "insects", label: "Insects", categories: ["insect"] },
  { key: "arachnids", label: "Arachnids", categories: ["arachnid"] },
  {
    key: "other-invertebrates",
    label: "Other Invertebrates",
    categories: ["other-invertebrate"]
  },
  {
    key: "plants",
    label: "Plants",
    categories: ["flowering-plant", "cactus-succulent"]
  },
  { key: "fungi", label: "Fungi", categories: ["fungus-lichen"] },
  { key: "mysteries", label: "Mysteries", categories: ["mystery"] }
] as const satisfies readonly CategoryGroupDefinition[];

const categoryGroupsByCategory = new Map<CollectionCategory, CategoryGroupDefinition>(
  categoryGroups.flatMap((group) =>
    group.categories.map((category) => [category, group] as const)
  )
);

function getCategoryGroup(category: CollectionCategory): CategoryGroupDefinition {
  const group = categoryGroupsByCategory.get(category);

  if (!group) {
    throw new Error(`Unknown collection category ${category}`);
  }

  return group;
}

function getDisplayName(creature: Creature) {
  return creature.displayName.customName ?? creature.displayName.generatedNickname;
}

function createTreatments(
  status: CollectionStatus,
  isFavorite: boolean,
  isNew: boolean
): CollectionTreatment[] {
  const treatments: CollectionTreatment[] = [];

  if (status === "published") {
    treatments.push("published");
  }
  if (status === "mystery") {
    treatments.push("mystery");
  }
  if (status === "draft") {
    treatments.push("draft");
  }
  if (status === "locked") {
    treatments.push("locked");
  }
  if (isFavorite) {
    treatments.push("favorite");
  }
  if (isNew) {
    treatments.push("new");
  }

  return treatments;
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC"
  }).format(date);
}

function formatLastSeenLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function getSeason(date: Date) {
  const month = date.getUTCMonth();

  if (month >= 2 && month <= 4) {
    return "Spring";
  }
  if (month >= 5 && month <= 7) {
    return "Summer";
  }
  if (month >= 8 && month <= 10) {
    return "Fall";
  }

  return "Winter";
}

function findLatestObservedAt(record: ResolvedFixtureCreature) {
  return record.observations
    .map((observation) => observation.observedAt)
    .filter((observedAt): observedAt is string => observedAt !== null)
    .sort()
    .at(-1);
}

function findPublicLocationLabel(record: ResolvedFixtureCreature) {
  return (
    record.observations.find((observation) => observation.publicLocationLabel)
      ?.publicLocationLabel ?? null
  );
}

function createRecordCard(
  record: ResolvedFixtureCreature,
  favoriteIds: ReadonlySet<string>,
  newIds: ReadonlySet<string>,
  checklistIds: ReadonlySet<string> | null,
  dripdexNumberOverride?: string
): CollectionCard {
  const { creature } = record;
  const group = getCategoryGroup(creature.category);
  const isFavorite = favoriteIds.has(creature.id);
  const isNew = newIds.has(creature.id);
  const isPublic = creature.publicVisibility === "public";
  const latestObservedAt = findLatestObservedAt(record);
  const lastSeenDate = latestObservedAt ? new Date(latestObservedAt) : null;
  const checklistState =
    creature.status === "published"
      ? checklistIds === null || checklistIds.has(creature.id)
        ? "found"
        : "unseeded"
      : "none";

  return {
    id: creature.id,
    href:
      isPublic && creature.status === "published"
        ? `/creatures/${creature.id}`
        : isPublic && creature.status === "mystery"
          ? `/mysteries/${creature.id}`
          : null,
    dripdexNumber: dripdexNumberOverride ?? creature.dripdexNumber,
    category: creature.category,
    categoryLabel: group.label,
    categoryGroupKey: group.key,
    commonName: creature.commonName,
    displayName: getDisplayName(creature),
    scientificName: creature.scientificName,
    nickname: creature.displayName.generatedNickname,
    status: creature.status,
    treatments: createTreatments(creature.status, isFavorite, isNew),
    checklistState,
    image: {
      card: record.defaultPhoto.files.card,
      thumbnail: record.defaultPhoto.files.thumbnail,
      full: record.defaultPhoto.files.full
    },
    typeTags: [...creature.tags.typeTags],
    foodChainTags: [...creature.tags.foodChainTags],
    seasonality: [...creature.tags.seasonality],
    safetyLabels: [...creature.tags.safetyLabels],
    rarity: creature.rarity.rank,
    seenCount: record.observations.length,
    lastSeenLabel: lastSeenDate ? formatLastSeenLabel(lastSeenDate) : null,
    lastSeenMonth: lastSeenDate ? formatMonth(lastSeenDate) : null,
    lastSeenSeason: lastSeenDate ? getSeason(lastSeenDate) : null,
    publicLocationLabel: findPublicLocationLabel(record),
    needsHumanValidation: creature.needsHumanValidation,
    isFavorite,
    isNew,
    isLocked: false,
    isMystery: creature.status === "mystery",
    isDraft: creature.status === "draft",
    isPublished: creature.status === "published"
  };
}

function createLockedCard(
  input: LockedCollectionCardInput,
  favoriteIds: ReadonlySet<string>,
  newIds: ReadonlySet<string>
): CollectionCard {
  const group = getCategoryGroup(input.category);
  const isFavorite = favoriteIds.has(input.id);
  const isNew = newIds.has(input.id);
  const displayName = input.displayName ?? input.commonName ?? "Locked Creature";

  return {
    id: input.id,
    href: null,
    dripdexNumber: input.dripdexNumber ?? null,
    category: input.category,
    categoryLabel: group.label,
    categoryGroupKey: group.key,
    commonName: input.commonName ?? displayName,
    displayName,
    scientificName: input.scientificName ?? null,
    nickname: input.nickname ?? null,
    status: "locked",
    treatments: createTreatments("locked", isFavorite, isNew),
    checklistState: "locked",
    image: null,
    typeTags: [],
    foodChainTags: [],
    seasonality: [],
    safetyLabels: [],
    rarity: null,
    seenCount: 0,
    lastSeenLabel: null,
    lastSeenMonth: null,
    lastSeenSeason: null,
    publicLocationLabel: null,
    needsHumanValidation: false,
    isFavorite,
    isNew,
    isLocked: true,
    isMystery: false,
    isDraft: false,
    isPublished: false
  };
}

function compareCards(a: CollectionCard, b: CollectionCard) {
  const aNumber = a.dripdexNumber ?? "";
  const bNumber = b.dripdexNumber ?? "";
  const dripdexOrder = aNumber.localeCompare(bNumber);

  if (dripdexOrder !== 0) {
    return dripdexOrder;
  }

  return a.displayName.localeCompare(b.displayName);
}

function createGroups(cards: CollectionCard[]): CollectionGroup[] {
  return categoryGroups.map((group) => ({
    key: group.key,
    label: group.label,
    categories: group.categories,
    cards: cards
      .filter((card) => card.categoryGroupKey === group.key)
      .sort(compareCards)
  }));
}

function createProgress(cards: readonly CollectionCard[]): CollectionProgress {
  const found = cards.filter((card) => card.status === "published").length;
  const total = found + cards.filter((card) => card.status === "locked").length;

  return { found, total };
}

function parseDripdexNumber(dripdexNumber: string | null) {
  if (dripdexNumber === null || !/^\d+$/.test(dripdexNumber)) {
    return null;
  }

  return Number(dripdexNumber);
}

function formatDripdexNumber(value: number) {
  return String(value).padStart(3, "0");
}

function createUnseededNumberAssigner(
  records: readonly ResolvedFixtureCreature[],
  lockedCards: readonly LockedCollectionCardInput[],
  checklistIds: ReadonlySet<string> | null
) {
  const usedNumbers = new Set<string>();

  for (const record of records) {
    const reservesCollectionNumber =
      record.creature.status === "mystery" ||
      (record.creature.status === "published" &&
        (checklistIds === null || checklistIds.has(record.creature.id)));

    if (reservesCollectionNumber) {
      usedNumbers.add(record.creature.dripdexNumber);
    }
  }
  for (const lockedCard of lockedCards) {
    if (lockedCard.dripdexNumber) {
      usedNumbers.add(lockedCard.dripdexNumber);
    }
  }

  let nextNumber =
    Math.max(
      0,
      ...[...usedNumbers]
        .map(parseDripdexNumber)
        .filter((value): value is number => value !== null)
    ) + 1;

  return () => {
    let formatted = formatDripdexNumber(nextNumber);

    while (usedNumbers.has(formatted)) {
      nextNumber += 1;
      formatted = formatDripdexNumber(nextNumber);
    }

    usedNumbers.add(formatted);
    nextNumber += 1;

    return formatted;
  };
}

export function buildCollectionViewModel(
  records: readonly ResolvedFixtureCreature[],
  options: BuildCollectionViewModelOptions = {}
): CollectionViewModel {
  const favoriteIds = new Set(options.favoriteCreatureIds ?? []);
  const newIds = new Set(options.newCreatureIds ?? []);
  const checklistIds = options.checklistCreatureIds
    ? new Set(options.checklistCreatureIds)
    : null;
  const lockedCards = (options.lockedCards ?? []).map((card) =>
    createLockedCard(card, favoriteIds, newIds)
  );
  const assignUnseededNumber = createUnseededNumberAssigner(
    records,
    options.lockedCards ?? [],
    checklistIds
  );
  const recordCards = records.map((record) => {
    const shouldAssignUnseededNumber =
      checklistIds !== null &&
      record.creature.status === "published" &&
      !checklistIds.has(record.creature.id);

    return createRecordCard(
      record,
      favoriteIds,
      newIds,
      checklistIds,
      shouldAssignUnseededNumber ? assignUnseededNumber() : undefined
    );
  });
  const cards = [...recordCards, ...lockedCards].sort(compareCards);

  return {
    cards,
    groups: createGroups(cards),
    favorites: cards.filter((card) => card.isFavorite).sort(compareCards),
    progress: createProgress(cards)
  };
}
