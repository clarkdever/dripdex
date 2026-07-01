import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CollectionPage,
  CollectionPageCard,
  type CollectionPageCardProps
} from "./collection-view";
import { createCollectionPageViewModel } from "./collection-page-data";
import type { CollectionCard } from "../domain/collection/collection-view-model";

function getCard(name: string) {
  return screen.getByRole("article", { name: new RegExp(name, "i") });
}

function getCardLink(name: string) {
  return screen.getByRole("link", { name: new RegExp(name, "i") });
}

function createCard(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return {
    id: "test-card",
    href: "/creatures/test-card",
    dripdexNumber: "099",
    category: "bird",
    categoryLabel: "Birds",
    categoryGroupKey: "birds",
    commonName: "Ladder-backed Woodpecker",
    displayName: "Ladder-backed Woodpecker",
    scientificName: "Dryobates scalaris",
    nickname: null,
    status: "published",
    treatments: ["published"],
    checklistState: "found",
    image: {
      card: "docs/fixtures/web-images/house-finch-card.jpg",
      thumbnail: "docs/fixtures/web-images/house-finch-thumb.jpg",
      full: "docs/fixtures/web-images/house-finch-full.jpg"
    },
    typeTags: ["Flying", "Predator"],
    foodChainTags: ["Predator"],
    seasonality: ["Year Round"],
    safetyLabels: ["Keep Distance"],
    rarity: "Common",
    seenCount: 1,
    lastSeenLabel: "Jun 1, 2026",
    lastSeenMonth: "June",
    lastSeenSeason: "Summer",
    publicLocationLabel: "Texas Hill Country example fixture",
    needsHumanValidation: false,
    isFavorite: false,
    isNew: false,
    isLocked: false,
    isMystery: false,
    isDraft: false,
    isPublished: true,
    ...overrides
  };
}

function renderCard(props: Partial<CollectionPageCardProps> = {}) {
  render(
    <CollectionPageCard
      card={props.card ?? createCard()}
      density={props.density ?? "standard"}
    />
  );
}

describe("CollectionPage", () => {
  it("renders cards from fixture-backed collection data", () => {
    render(<CollectionPage viewModel={createCollectionPageViewModel()} />);

    const birds = screen.getByRole("region", { name: /birds/i });
    const houseFinch = within(birds).getByRole("link", {
      name: /House Finch/i
    });

    expect(houseFinch).toHaveAttribute("href", "/creatures/house-finch");
    expect(within(houseFinch).getByText("#001")).toBeInTheDocument();
    expect(within(houseFinch).getByText("House Finch")).toBeInTheDocument();
    expect(within(houseFinch).getByText("Haemorhous mexicanus")).toBeInTheDocument();
    expect(
      within(houseFinch).getByRole("img", { name: /house finch/i })
    ).toHaveAttribute("src", "/fixtures/web-images/house-finch-card.jpg");
  });

  it("shows a front-row favorites section only when favorites exist", () => {
    const viewModel = createCollectionPageViewModel();
    const withoutFavorites = {
      ...viewModel,
      favorites: []
    };
    const { rerender } = render(<CollectionPage viewModel={withoutFavorites} />);

    expect(
      screen.queryByRole("region", { name: /front row favorites/i })
    ).not.toBeInTheDocument();

    rerender(<CollectionPage viewModel={viewModel} />);

    expect(
      screen.getByRole("region", { name: /front row favorites/i })
    ).toBeInTheDocument();
  });

  it("filters collection cards with the visible search and status controls", () => {
    render(<CollectionPage viewModel={createCollectionPageViewModel()} />);

    fireEvent.click(screen.getByRole("button", { name: /drafts/i }));

    expect(getCard("False Widow")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /House Finch/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /drafts/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: /all/i }));
    fireEvent.change(screen.getByRole("searchbox", { name: /search collection/i }), {
      target: { value: "toad" }
    });
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));

    expect(getCardLink("Gulf Coast Toad")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /House Finch/i })).not.toBeInTheDocument();
  });

  it("shows an empty state when no cards match the search", () => {
    render(<CollectionPage viewModel={createCollectionPageViewModel()} />);

    fireEvent.change(screen.getByRole("searchbox", { name: /search collection/i }), {
      target: { value: "not-a-local-creature" }
    });
    fireEvent.click(screen.getByRole("button", { name: /filter/i }));

    expect(screen.getByText("No finds here yet")).toBeInTheDocument();
  });
});

describe("CollectionPageCard", () => {
  it("opens published public cards on their creature journal page", () => {
    renderCard();

    const card = getCardLink("Ladder-backed Woodpecker");

    expect(card).toHaveAttribute("href", "/creatures/test-card");
    expect(card).toHaveClass("collection-card");
    expect(within(card).getByText("FOUND")).toBeInTheDocument();
  });

  it("renders mystery cards with question-mark and grayscale treatment", () => {
    renderCard({
      card: createCard({
        commonName: "????",
        displayName: "????",
        scientificName: null,
        status: "mystery",
        treatments: ["mystery"],
        href: "/mysteries/test-card",
        isMystery: true,
        isPublished: false
      })
    });

    const card = getCardLink("mystery");

    expect(card).toHaveAttribute("href", "/mysteries/test-card");
    expect(card).toHaveClass("collection-card--mystery");
    expect(within(card).getByText("?")).toBeInTheDocument();
    expect(within(card).getByText("MYSTERY")).toBeInTheDocument();
  });

  it("renders draft cards with a diagonal red draft stamp", () => {
    renderCard({
      card: createCard({
        commonName: "False Widow",
        displayName: "False Widow",
        scientificName: "Steatoda sp.",
        status: "draft",
        treatments: ["draft"],
        href: null,
        isDraft: true,
        isPublished: false
      })
    });

    const card = getCard("False Widow");
    const stamp = within(card).getByLabelText("Draft stamp");

    expect(screen.queryByRole("link", { name: /False Widow/i })).not.toBeInTheDocument();
    expect(card).toHaveClass("collection-card--draft");
    expect(stamp).toHaveClass("collection-card__draft-stamp");
  });

  it("renders locked checklist cards with lock treatment", () => {
    renderCard({
      card: createCard({
        image: null,
        commonName: "Ladder-backed Woodpecker",
        displayName: "Ladder-backed Woodpecker",
        scientificName: null,
        status: "locked",
        treatments: ["locked"],
        checklistState: "locked",
        href: null,
        isLocked: true,
        isPublished: false
      })
    });

    const card = getCard("Ladder-backed Woodpecker");

    expect(
      screen.queryByRole("link", { name: /Ladder-backed Woodpecker/i })
    ).not.toBeInTheDocument();
    expect(card).toHaveClass("collection-card--locked");
    expect(
      within(card).getByLabelText("Locked checklist slot")
    ).toBeInTheDocument();
    expect(within(card).getByText("LOCKED")).toBeInTheDocument();
  });
});
