import { describe, expect, it } from "vitest";

import { createFixtureRepository } from "../fixtures/fixture-repository";
import type { ResolvedFixtureCreature } from "../fixtures/fixture-repository";
import { buildCollectionViewModel } from "./collection-view-model";

const orderedGroupLabels = [
  "Birds",
  "Mammals",
  "Reptiles",
  "Amphibians",
  "Fish",
  "Insects",
  "Arachnids",
  "Other Invertebrates",
  "Plants",
  "Fungi",
  "Mysteries"
];

function cloneRecord(record: ResolvedFixtureCreature): ResolvedFixtureCreature {
  return structuredClone(record);
}

function createFixtureRecords() {
  return createFixtureRepository({ projectRoot: process.cwd() }).listCreatures();
}

describe("collection view model", () => {
  it("turns fixture repository records into cards and ordered category groups", () => {
    const records = createFixtureRecords();

    const viewModel = buildCollectionViewModel(records);

    expect(viewModel.cards).toHaveLength(records.length);
    expect(viewModel.groups.map((group) => group.label)).toEqual(orderedGroupLabels);
    expect(viewModel.groups.map((group) => group.key)).toEqual([
      "birds",
      "mammals",
      "reptiles",
      "amphibians",
      "fish",
      "insects",
      "arachnids",
      "other-invertebrates",
      "plants",
      "fungi",
      "mysteries"
    ]);

    const houseFinch = viewModel.cards.find((card) => card.id === "house-finch");
    expect(houseFinch).toMatchObject({
      id: "house-finch",
      href: "/creatures/house-finch",
      dripdexNumber: "001",
      category: "bird",
      categoryLabel: "Birds",
      categoryGroupKey: "birds",
      commonName: "House Finch",
      displayName: "Crimson Chirper",
      nickname: "Crimson Chirper",
      scientificName: "Haemorhous mexicanus",
      status: "published",
      typeTags: ["Flying", "Light", "Normal"],
      foodChainTags: ["Herbivore", "Prey", "Seed Spreader"],
      seasonality: ["Year Round"],
      safetyLabels: ["Keep Distance"],
      rarity: "Common",
      seenCount: 1,
      publicLocationLabel: "Texas Hill Country example fixture",
      image: {
        card: expect.stringContaining("-card."),
        thumbnail: expect.stringContaining("-thumb."),
        full: expect.stringContaining("-full.")
      },
      isPublished: true,
      isDraft: false,
      isMystery: false,
      isLocked: false,
      needsHumanValidation: true
    });
    expect(houseFinch?.treatments).toEqual(["published"]);

    const plantGroup = viewModel.groups.find((group) => group.key === "plants");
    expect(plantGroup?.cards.map((card) => card.id)).toEqual([
      "texas-bluebonnet",
      "texas-prickly-pear"
    ]);
  });

  it("represents published, mystery, favorite, new, locked, and draft treatments", () => {
    const records = createFixtureRecords();
    const draftRecord = cloneRecord(
      records.find((record) => record.creature.id === "house-finch")!
    );
    draftRecord.creature.id = "draft-house-finch";
    draftRecord.creature.dripdexNumber = "998";
    draftRecord.creature.status = "draft";
    draftRecord.creature.commonName = "Draft House Finch";

    const viewModel = buildCollectionViewModel([...records, draftRecord], {
      favoriteCreatureIds: ["house-finch"],
      newCreatureIds: ["white-tailed-deer"],
      lockedCards: [
        {
          id: "locked-armadillo",
          dripdexNumber: "999",
          category: "mammal",
          commonName: "Nine-banded Armadillo"
        }
      ]
    });

    expect(viewModel.cards.find((card) => card.id === "house-finch")).toMatchObject({
      status: "published",
      isPublished: true,
      isFavorite: true,
      treatments: ["published", "favorite"]
    });
    expect(viewModel.favorites.map((card) => card.id)).toEqual(["house-finch"]);

    expect(
      viewModel.cards.find((card) => card.id === "white-tailed-deer")
    ).toMatchObject({
      isNew: true,
      treatments: ["published", "new"]
    });

    expect(
      viewModel.cards.find((card) => card.id === "mystery-white-shelf-fungus")
    ).toMatchObject({
      href: "/mysteries/mystery-white-shelf-fungus",
      status: "mystery",
      categoryGroupKey: "mysteries",
      isMystery: true,
      treatments: ["mystery"]
    });

    expect(viewModel.cards.find((card) => card.id === "draft-house-finch")).toMatchObject({
      href: null,
      status: "draft",
      isDraft: true,
      treatments: ["draft"]
    });

    expect(viewModel.cards.find((card) => card.id === "locked-armadillo")).toMatchObject({
      href: null,
      status: "locked",
      categoryGroupKey: "mammals",
      isLocked: true,
      checklistState: "locked",
      treatments: ["locked"]
    });
  });

  it("does not link private records from the public collection", () => {
    const records = createFixtureRecords();
    const privateMysteryRecord = cloneRecord(
      records.find((record) => record.creature.id === "mystery-white-shelf-fungus")!
    );
    privateMysteryRecord.creature.id = "private-mystery";
    privateMysteryRecord.creature.dripdexNumber = "996";
    privateMysteryRecord.creature.publicVisibility = "private";

    const privatePublishedRecord = cloneRecord(
      records.find((record) => record.creature.id === "house-finch")!
    );
    privatePublishedRecord.creature.id = "private-house-finch";
    privatePublishedRecord.creature.dripdexNumber = "997";
    privatePublishedRecord.creature.publicVisibility = "private";

    const viewModel = buildCollectionViewModel([
      ...records,
      privateMysteryRecord,
      privatePublishedRecord
    ]);

    expect(viewModel.cards.find((card) => card.id === "private-mystery")).toMatchObject({
      href: null,
      isMystery: true
    });
    expect(viewModel.cards.find((card) => card.id === "private-house-finch")).toMatchObject({
      href: null,
      isPublished: true
    });
  });

  it("excludes draft and mystery from found progress while counting locked and unseeded published species", () => {
    const records = createFixtureRecords();
    const unseededRecord = cloneRecord(
      records.find((record) => record.creature.id === "texas-spiny-lizard")!
    );
    unseededRecord.creature.id = "confirmed-unseeded-lizard";
    unseededRecord.creature.dripdexNumber = "997";
    unseededRecord.creature.commonName = "Confirmed Unseeded Lizard";

    const draftRecord = cloneRecord(
      records.find((record) => record.creature.id === "house-finch")!
    );
    draftRecord.creature.id = "draft-house-finch";
    draftRecord.creature.dripdexNumber = "998";
    draftRecord.creature.status = "draft";

    const checklistCreatureIds = records
      .filter((record) => record.creature.status === "published")
      .map((record) => record.creature.id);
    const seededPublishedCount = checklistCreatureIds.length;

    const viewModel = buildCollectionViewModel(
      [...records, unseededRecord, draftRecord],
      {
        checklistCreatureIds,
        lockedCards: [
          {
            id: "locked-armadillo",
            dripdexNumber: "013",
            category: "mammal",
            commonName: "Nine-banded Armadillo"
          }
        ]
      }
    );

    expect(viewModel.progress).toEqual({
      found: seededPublishedCount + 1,
      total: seededPublishedCount + 2
    });
    expect(
      viewModel.cards.find((card) => card.id === "confirmed-unseeded-lizard")
    ).toMatchObject({
      dripdexNumber: "014",
      checklistState: "unseeded"
    });
  });
});
