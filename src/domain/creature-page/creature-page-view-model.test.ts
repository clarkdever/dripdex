import { describe, expect, it } from "vitest";

import { createFixtureRepository } from "../fixtures/fixture-repository";
import type { ResolvedFixtureCreature } from "../fixtures/fixture-repository";
import { buildCreaturePageViewModel } from "./creature-page-view-model";

function createFixtureRecords() {
  return createFixtureRepository({ projectRoot: process.cwd() }).listCreatures();
}

function findRecord(id: string) {
  const record = createFixtureRecords().find(
    (candidate) => candidate.creature.id === id
  );

  if (!record) {
    throw new Error(`Missing fixture record ${id}`);
  }

  return record;
}

function cloneRecord(record: ResolvedFixtureCreature): ResolvedFixtureCreature {
  return structuredClone(record);
}

describe("buildCreaturePageViewModel", () => {
  it("resolves a published fixture creature into journal page sections", () => {
    const viewModel = buildCreaturePageViewModel(findRecord("house-finch"));

    expect(viewModel).toMatchObject({
      kind: "published-journal",
      id: "house-finch",
      dripdexNumber: "001",
      displayName: "Crimson Chirper",
      commonName: "House Finch",
      nickname: "Crimson Chirper",
      scientificName: "Haemorhous mexicanus",
      category: "bird",
      status: "published",
      rarity: {
        rank: "Common",
        source: "fixture"
      },
      flavorText:
        "A tiny front-yard singer with a raspberry-red splash and a habit of turning feeders into social clubs.",
      adultScience: {
        summary:
          "Fixture placeholder. Production content should be generated from cited research and reviewed before publication.",
        citations: [
          {
            label: "Source image validation page",
            url: "https://commons.wikimedia.org/wiki/File:House_Finch_(male)_(23934285480).jpg"
          }
        ]
      },
      tags: {
        type: ["Flying", "Light", "Normal"],
        foodChain: ["Herbivore", "Prey", "Seed Spreader"],
        seasonality: ["Year Round"],
        safety: ["Keep Distance"]
      },
      defaultPhoto: {
        id: "photo-house-finch-001",
        role: "default",
        altText: "House Finch",
        files: {
          card: "docs/fixtures/web-images/house-finch-card.jpg",
          thumbnail: "docs/fixtures/web-images/house-finch-thumb.jpg",
          full: "docs/fixtures/web-images/house-finch-full.jpg"
        }
      },
      carouselPhotos: [
        {
          id: "photo-house-finch-001",
          role: "default"
        }
      ],
      observations: [
        {
          id: "obs-house-finch-001",
          publicLocationLabel: "Texas Hill Country example fixture",
          observedAtLabel: null,
          identification: {
            commonName: "House Finch",
            scientificName: "Haemorhous mexicanus",
            confidence: "source_page_identified"
          }
        }
      ],
      history: [
        {
          id: "event-house-finch-first-found",
          label: "First fixture record created",
          dateLabel: "Jun 29, 2026"
        },
        {
          id: "event-house-finch-photo-added",
          label: "Default photo added",
          dateLabel: "Jun 29, 2026"
        }
      ],
      ownerNotes: null
    });
  });

  it("routes mystery fixture creatures to the mystery workspace model", () => {
    const viewModel = buildCreaturePageViewModel(
      findRecord("mystery-white-shelf-fungus")
    );

    expect(viewModel).toEqual({
      kind: "mystery-workspace",
      id: "mystery-white-shelf-fungus",
      mysteryId: "mystery-white-shelf-fungus",
      displayName: "Question Shelf",
      commonName: "????",
      sourceKnownName: "White shelf fungus",
      defaultPhoto: {
        id: "photo-mystery-white-shelf-fungus-001",
        altText: "Question Shelf",
        files: {
          card: "docs/fixtures/web-images/mystery-white-shelf-fungus-card.jpg",
          thumbnail: "docs/fixtures/web-images/mystery-white-shelf-fungus-thumb.jpg",
          full: "docs/fixtures/web-images/mystery-white-shelf-fungus-full.jpg"
        }
      },
      workspaceHref: "/mysteries/mystery-white-shelf-fungus",
      reason: "Mystery entries resolve in the mystery investigation workspace."
    });
  });

  it.each([
    ["draft" as const, "public" as const],
    ["hidden" as const, "public" as const],
    ["needs_review" as const, "public" as const],
    ["published" as const, "private" as const],
    ["published" as const, "hidden" as const],
    ["mystery" as const, "private" as const],
    ["mystery" as const, "hidden" as const]
  ])(
    "returns a not-public model for %s records with %s visibility",
    (status, publicVisibility) => {
      const record = cloneRecord(
        findRecord(status === "mystery" ? "mystery-white-shelf-fungus" : "house-finch")
      );
      record.creature.status = status;
      record.creature.publicVisibility = publicVisibility;

      const viewModel = buildCreaturePageViewModel(record);

      expect(viewModel).toEqual({
        kind: "not-public",
        id: record.creature.id,
        status,
        publicVisibility,
        reason: "Creature journal is not public."
      });
    }
  );

  it("omits private observation and source-copy fields from the public journal model", () => {
    const record = cloneRecord(findRecord("house-finch"));
    record.observations[0].exactLocation = {
      latitude: 30.123456,
      longitude: -98.123456
    };
    record.observations[0].notes =
      "private note with exact home trail directions and owner-only context";
    record.observations[0].identification.candidateHistory = [
      {
        privateCandidate: "owner-only"
      }
    ];

    const viewModel = buildCreaturePageViewModel(record);
    const serialized = JSON.stringify(viewModel);

    expect(viewModel.kind).toBe("published-journal");
    expect(serialized).not.toContain("30.123456");
    expect(serialized).not.toContain("sourceCopy");
    expect(serialized).not.toContain("candidateHistory");
    expect(serialized).not.toContain("private note");
    if (viewModel.kind === "published-journal") {
      expect(viewModel.observations[0]).not.toHaveProperty("notes");
      expect(viewModel.defaultPhoto.files).not.toHaveProperty("sourceCopy");
      expect(viewModel.defaultPhoto.dimensions).not.toHaveProperty("sourceCopy");
    }
  });

  it("omits empty optional variant groups cleanly", () => {
    const record = cloneRecord(findRecord("house-finch"));
    record.creature.variants = {
      sex: [],
      lifeStages: [],
      plantOrFungusStages: []
    };

    const viewModel = buildCreaturePageViewModel(record);

    expect(viewModel.kind).toBe("published-journal");
    if (viewModel.kind === "published-journal") {
      expect(viewModel.variantGroups).toEqual([]);
    }
  });

  it("includes only populated variant groups", () => {
    const record = cloneRecord(findRecord("american-snout"));
    record.creature.variants = {
      sex: [],
      lifeStages: ["Caterpillar", "Adult"],
      plantOrFungusStages: []
    };

    const viewModel = buildCreaturePageViewModel(record);

    expect(viewModel.kind).toBe("published-journal");
    if (viewModel.kind === "published-journal") {
      expect(viewModel.variantGroups).toEqual([
        {
          key: "lifeStages",
          label: "Life Stages",
          values: ["Caterpillar", "Adult"]
        }
      ]);
    }
  });
});
