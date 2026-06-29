import type {
  CollectionCard,
  CollectionCategory,
  CollectionGroup,
  CollectionStatus,
  CollectionViewModel
} from "./collection-view-model";

export type PrimaryCollectionFilter =
  | "all"
  | "found"
  | "favorites"
  | "drafts"
  | "mysteries";

export type CollectionSearchFilters = {
  query?: string;
  primary?: PrimaryCollectionFilter;
  category?: CollectionCategory | readonly CollectionCategory[];
  rarity?: string | readonly string[];
  safetyLabel?: string | readonly string[];
  seasonality?: string | readonly string[];
  foodChainRole?: string | readonly string[];
  status?: CollectionStatus | readonly CollectionStatus[];
  typeTag?: string | readonly string[];
};

export type CollectionSearchEmptyState = {
  isEmpty: boolean;
  message: "No finds here yet" | null;
};

export type CollectionCardSearchResult = {
  cards: readonly CollectionCard[];
  emptyState: CollectionSearchEmptyState;
};

export type CollectionViewModelSearchResult = CollectionViewModel & {
  emptyState: CollectionSearchEmptyState;
};

const emptyFindsMessage = "No finds here yet";

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeOptional(value: string | null | undefined) {
  return value ? normalize(value) : null;
}

function createEmptyState(cards: readonly CollectionCard[]): CollectionSearchEmptyState {
  return {
    isEmpty: cards.length === 0,
    message: cards.length === 0 ? emptyFindsMessage : null
  };
}

function hasFilterValue<T extends string>(value: T | readonly T[] | undefined) {
  return toFilterValues(value).length > 0;
}

function toFilterValues<T extends string>(value: T | readonly T[] | undefined) {
  if (value === undefined) {
    return [];
  }

  return (Array.isArray(value) ? value : [value]).map(normalize).filter(Boolean);
}

function matchesOneOf(value: string | null | undefined, filter: string | readonly string[] | undefined) {
  if (!hasFilterValue(filter)) {
    return true;
  }

  const normalizedValue = normalizeOptional(value);

  if (!normalizedValue) {
    return false;
  }

  return toFilterValues(filter).includes(normalizedValue);
}

function matchesAnyValue(
  values: readonly string[],
  filter: string | readonly string[] | undefined
) {
  if (!hasFilterValue(filter)) {
    return true;
  }

  const valueSet = new Set(values.map(normalize));

  return toFilterValues(filter).some((filterValue) => valueSet.has(filterValue));
}

function getSearchValues(card: CollectionCard) {
  return [
    card.commonName,
    card.scientificName,
    card.nickname,
    card.displayName,
    card.category,
    card.categoryLabel,
    card.categoryGroupKey,
    card.status,
    card.dripdexNumber,
    card.dripdexNumber ? `#${card.dripdexNumber}` : null,
    ...card.typeTags,
    ...card.foodChainTags,
    ...card.seasonality,
    ...card.safetyLabels
  ].filter((value): value is string => value !== null);
}

function matchesQuery(card: CollectionCard, query: string | undefined) {
  const normalizedQuery = normalize(query ?? "");

  if (!normalizedQuery) {
    return true;
  }

  return getSearchValues(card).some((value) => normalize(value).includes(normalizedQuery));
}

function matchesPrimary(card: CollectionCard, primary: PrimaryCollectionFilter | undefined) {
  switch (primary ?? "all") {
    case "all":
      return true;
    case "found":
      return (
        card.status === "published" &&
        card.isPublished &&
        !card.isLocked &&
        !card.isDraft &&
        !card.isMystery
      );
    case "favorites":
      return card.isFavorite;
    case "drafts":
      return card.status === "draft" || card.isDraft;
    case "mysteries":
      return card.status === "mystery" || card.isMystery;
  }
}

function matchesSecondaryFilters(card: CollectionCard, filters: CollectionSearchFilters) {
  return (
    matchesOneOf(card.category, filters.category) &&
    matchesOneOf(card.rarity, filters.rarity) &&
    matchesAnyValue(card.safetyLabels, filters.safetyLabel) &&
    matchesAnyValue(card.seasonality, filters.seasonality) &&
    matchesAnyValue(card.foodChainTags, filters.foodChainRole) &&
    matchesOneOf(card.status, filters.status) &&
    matchesAnyValue(card.typeTags, filters.typeTag)
  );
}

function matchesFilters(card: CollectionCard, filters: CollectionSearchFilters) {
  return (
    matchesQuery(card, filters.query) &&
    matchesPrimary(card, filters.primary) &&
    matchesSecondaryFilters(card, filters)
  );
}

function filterGroups(
  groups: readonly CollectionGroup[],
  matchingCardIds: ReadonlySet<string>
): CollectionGroup[] {
  return groups
    .map((group) => ({
      ...group,
      cards: group.cards.filter((card) => matchingCardIds.has(card.id))
    }))
    .filter((group) => group.cards.length > 0);
}

export function filterCollectionCards(
  cards: readonly CollectionCard[],
  filters: CollectionSearchFilters = {}
): CollectionCardSearchResult {
  const filteredCards = cards.filter((card) => matchesFilters(card, filters));

  return {
    cards: filteredCards,
    emptyState: createEmptyState(filteredCards)
  };
}

export function filterCollectionViewModel(
  viewModel: CollectionViewModel,
  filters: CollectionSearchFilters = {}
): CollectionViewModelSearchResult {
  const { cards, emptyState } = filterCollectionCards(viewModel.cards, filters);
  const matchingCardIds = new Set(cards.map((card) => card.id));

  return {
    ...viewModel,
    cards,
    groups: filterGroups(viewModel.groups, matchingCardIds),
    favorites: viewModel.favorites.filter((card) => matchingCardIds.has(card.id)),
    emptyState
  };
}
