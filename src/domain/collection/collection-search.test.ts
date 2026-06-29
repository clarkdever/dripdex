import { describe, expect, it } from "vitest";

import type { CollectionCard, CollectionViewModel } from "./collection-view-model";
import { filterCollectionCards, filterCollectionViewModel } from "./collection-search";

function createCard(overrides: Partial<CollectionCard> & Pick<CollectionCard, "id">): CollectionCard {
  const status = overrides.status ?? "published";
  const isFavorite = overrides.isFavorite ?? false;
  const isNew = overrides.isNew ?? false;
  const isLocked = overrides.isLocked ?? status === "locked";
  const isMystery = overrides.isMystery ?? status === "mystery";
  const isDraft = overrides.isDraft ?? status === "draft";
  const isPublished = overrides.isPublished ?? status === "published";

  return {
    id: overrides.id,
    dripdexNumber: overrides.dripdexNumber ?? "001",
    category: overrides.category ?? "bird",
    categoryLabel: overrides.categoryLabel ?? "Birds",
    categoryGroupKey: overrides.categoryGroupKey ?? "birds",
    commonName: overrides.commonName ?? "House Finch",
    displayName: overrides.displayName ?? "Crimson Chirper",
    scientificName: overrides.scientificName ?? "Haemorhous mexicanus",
    nickname: overrides.nickname ?? "Crimson Chirper",
    status,
    treatments: overrides.treatments ?? ["published"],
    checklistState: overrides.checklistState ?? "found",
    image: overrides.image ?? null,
    typeTags: overrides.typeTags ?? ["Flying", "Light"],
    foodChainTags: overrides.foodChainTags ?? ["Seed Spreader", "Prey"],
    seasonality: overrides.seasonality ?? ["Year Round"],
    safetyLabels: overrides.safetyLabels ?? ["Keep Distance"],
    rarity: overrides.rarity ?? "Common",
    seenCount: overrides.seenCount ?? 1,
    lastSeenLabel: overrides.lastSeenLabel ?? null,
    lastSeenMonth: overrides.lastSeenMonth ?? null,
    lastSeenSeason: overrides.lastSeenSeason ?? null,
    publicLocationLabel: overrides.publicLocationLabel ?? null,
    needsHumanValidation: overrides.needsHumanValidation ?? false,
    isFavorite,
    isNew,
    isLocked,
    isMystery,
    isDraft,
    isPublished
  };
}

const searchCards = [
  createCard({
    id: "bird",
    dripdexNumber: "007",
    category: "bird",
    categoryLabel: "Birds",
    categoryGroupKey: "birds",
    commonName: "Golden-cheeked Warbler",
    displayName: "Canyon Singer",
    scientificName: "Setophaga chrysoparia",
    nickname: "Canyon Singer",
    status: "published",
    typeTags: ["Flying", "Light"],
    foodChainTags: ["Insectivore", "Predator"],
    seasonality: ["Spring"],
    safetyLabels: ["Keep Distance"],
    rarity: "Rare"
  }),
  createCard({
    id: "plant",
    dripdexNumber: "042",
    category: "flowering-plant",
    categoryLabel: "Plants",
    categoryGroupKey: "plants",
    commonName: "Texas Bluebonnet",
    displayName: "Hill Country Banner",
    scientificName: "Lupinus texensis",
    nickname: "Hill Country Banner",
    status: "published",
    typeTags: ["Plant", "Grass"],
    foodChainTags: ["Producer", "Pollinator"],
    seasonality: ["Spring"],
    safetyLabels: ["Do Not Eat"],
    rarity: "Common"
  }),
  createCard({
    id: "mystery",
    dripdexNumber: "099",
    category: "mystery",
    categoryLabel: "Mysteries",
    categoryGroupKey: "mysteries",
    commonName: "Unknown Shelf Fungus",
    displayName: "Mystery Shelf",
    scientificName: null,
    nickname: "Mystery Shelf",
    status: "mystery",
    treatments: ["mystery"],
    checklistState: "none",
    typeTags: ["Mystery", "Fungi"],
    foodChainTags: ["Decomposer"],
    seasonality: ["Fall"],
    safetyLabels: ["Do Not Touch"],
    rarity: "Mystery"
  })
];

describe("collection search filters", () => {
  it.each([
    ["common name", "warbler", "bird"],
    ["scientific name", "chrysoparia", "bird"],
    ["nickname", "canyon singer", "bird"],
    ["display name", "hill country banner", "plant"],
    ["category label", "plants", "plant"],
    ["category key", "flowering-plant", "plant"],
    ["status", "mystery", "mystery"],
    ["type tag", "flying", "bird"],
    ["food-chain tag", "decomposer", "mystery"],
    ["seasonality", "fall", "mystery"],
    ["safety label", "do not eat", "plant"],
    ["DripDex number", "042", "plant"]
  ])("matches by %s", (_label, query, expectedId) => {
    const result = filterCollectionCards(searchCards, { query });

    expect(result.cards.map((card) => card.id)).toEqual([expectedId]);
    expect(result.emptyState).toEqual({ isEmpty: false, message: null });
  });

  it("trims whitespace and matches case-insensitively", () => {
    const result = filterCollectionCards(searchCards, { query: "  TEXAS BLUE  " });

    expect(result.cards.map((card) => card.id)).toEqual(["plant"]);
  });

  it("matches human-typed category and status variants", () => {
    expect(
      filterCollectionCards(searchCards, { query: "flowering plant" }).cards.map(
        (card) => card.id
      )
    ).toEqual(["plant"]);
    expect(
      filterCollectionCards(
        [
          createCard({
            id: "needs-review",
            status: "needs_review",
            treatments: []
          })
        ],
        { query: "needs review" }
      ).cards.map((card) => card.id)
    ).toEqual(["needs-review"]);
  });

  it("supports primary filters for all, found, favorites, drafts, and mysteries", () => {
    const cards = [
      createCard({ id: "published" }),
      createCard({ id: "favorite", isFavorite: true }),
      createCard({
        id: "draft",
        status: "draft",
        treatments: ["draft"],
        checklistState: "none"
      }),
      createCard({
        id: "mystery",
        status: "mystery",
        treatments: ["mystery"],
        checklistState: "none"
      }),
      createCard({
        id: "locked",
        status: "locked",
        treatments: ["locked"],
        checklistState: "locked"
      })
    ];

    expect(filterCollectionCards(cards, { primary: "all" }).cards.map((card) => card.id)).toEqual([
      "published",
      "favorite",
      "draft",
      "mystery",
      "locked"
    ]);
    expect(filterCollectionCards(cards, { primary: "found" }).cards.map((card) => card.id)).toEqual([
      "published",
      "favorite"
    ]);
    expect(
      filterCollectionCards(cards, { primary: "favorites" }).cards.map((card) => card.id)
    ).toEqual(["favorite"]);
    expect(filterCollectionCards(cards, { primary: "drafts" }).cards.map((card) => card.id)).toEqual([
      "draft"
    ]);
    expect(
      filterCollectionCards(cards, { primary: "mysteries" }).cards.map((card) => card.id)
    ).toEqual(["mystery"]);
  });

  it("supports secondary filters for category, rarity, safety, season, food chain, status, and type", () => {
    const filters = {
      category: "flowering-plant" as const,
      rarity: "Common",
      safetyLabel: "Do Not Eat",
      seasonality: "Spring",
      foodChainRole: "Producer",
      status: "published" as const,
      typeTag: "Plant"
    };

    expect(filterCollectionCards(searchCards, filters).cards.map((card) => card.id)).toEqual([
      "plant"
    ]);
  });

  it("accepts multiple secondary filter values within the same field", () => {
    const result = filterCollectionCards(searchCards, {
      category: ["bird", "flowering-plant"],
      typeTag: ["Flying", "Plant"]
    });

    expect(result.cards.map((card) => card.id)).toEqual(["bird", "plant"]);
  });

  it("treats empty secondary filter strings as unset", () => {
    const result = filterCollectionCards(searchCards, {
      rarity: "",
      safetyLabel: [""],
      typeTag: ""
    });

    expect(result.cards.map((card) => card.id)).toEqual([
      "bird",
      "plant",
      "mystery"
    ]);
  });

  it("returns a kid-readable empty state when no cards match", () => {
    const result = filterCollectionCards(searchCards, { query: "space whale" });

    expect(result.cards).toEqual([]);
    expect(result.emptyState).toEqual({
      isEmpty: true,
      message: "No finds here yet"
    });
  });

  it("filters view model cards, favorites, and non-empty category groups while keeping progress semantics", () => {
    const bird = createCard({ id: "bird", categoryGroupKey: "birds", categoryLabel: "Birds" });
    const mammal = createCard({
      id: "mammal",
      category: "mammal",
      categoryGroupKey: "mammals",
      categoryLabel: "Mammals",
      commonName: "White-tailed Deer",
      isFavorite: true
    });
    const plant = createCard({
      id: "plant",
      category: "flowering-plant",
      categoryGroupKey: "plants",
      categoryLabel: "Plants",
      commonName: "Texas Bluebonnet"
    });
    const viewModel: CollectionViewModel = {
      cards: [bird, mammal, plant],
      groups: [
        { key: "birds", label: "Birds", categories: ["bird"], cards: [bird] },
        { key: "mammals", label: "Mammals", categories: ["mammal"], cards: [mammal] },
        {
          key: "plants",
          label: "Plants",
          categories: ["flowering-plant", "cactus-succulent"],
          cards: [plant]
        }
      ],
      favorites: [mammal],
      progress: { found: 3, total: 5 }
    };

    const result = filterCollectionViewModel(viewModel, { query: "tailed deer" });

    expect(result.cards.map((card) => card.id)).toEqual(["mammal"]);
    expect(result.favorites.map((card) => card.id)).toEqual(["mammal"]);
    expect(result.groups.map((group) => ({ key: group.key, cardIds: group.cards.map((card) => card.id) }))).toEqual([
      { key: "mammals", cardIds: ["mammal"] }
    ]);
    expect(result.progress).toEqual({ found: 3, total: 5 });
  });

  it("preserves grouping for filtered results across multiple categories", () => {
    const result = filterCollectionViewModel(
      {
        cards: searchCards,
        groups: [
          { key: "birds", label: "Birds", categories: ["bird"], cards: [searchCards[0]] },
          {
            key: "plants",
            label: "Plants",
            categories: ["flowering-plant", "cactus-succulent"],
            cards: [searchCards[1]]
          },
          { key: "mysteries", label: "Mysteries", categories: ["mystery"], cards: [searchCards[2]] }
        ],
        favorites: [],
        progress: { found: 2, total: 3 }
      },
      { query: "spring" }
    );

    expect(result.groups.map((group) => ({ key: group.key, cardIds: group.cards.map((card) => card.id) }))).toEqual([
      { key: "birds", cardIds: ["bird"] },
      { key: "plants", cardIds: ["plant"] }
    ]);
  });
});
