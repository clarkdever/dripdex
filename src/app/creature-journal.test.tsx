import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildCreaturePageViewModel } from "../domain/creature-page/creature-page-view-model";
import type { PublishedCreatureJournalPage } from "../domain/creature-page/creature-page-view-model";
import { createFixtureRecords } from "./collection-page-data";
import { CreatureJournalPage } from "./creature-journal";

function createHouseFinchJournal(): PublishedCreatureJournalPage {
  const record = createFixtureRecords().find(
    (candidate) => candidate.creature.id === "house-finch"
  );

  if (!record) {
    throw new Error("Missing house finch fixture");
  }

  const viewModel = buildCreaturePageViewModel(record);

  if (viewModel.kind !== "published-journal") {
    throw new Error("Expected published journal fixture");
  }

  return viewModel;
}

describe("CreatureJournalPage", () => {
  it("renders the fixture-backed creature journal hero and tag families", () => {
    render(<CreatureJournalPage viewModel={createHouseFinchJournal()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "House Finch" })
    ).toBeInTheDocument();
    expect(screen.getByText("Crimson Chirper")).toBeInTheDocument();
    expect(screen.getByText("#001 House Finch")).toBeInTheDocument();
    expect(screen.getByText("Common Frame")).toBeInTheDocument();
    expect(screen.getByText(/tiny front-yard singer/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Types/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Flying")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /House Finch/i })).toHaveAttribute(
      "src",
      "/fixtures/web-images/house-finch-full.jpg"
    );
  });

  it("shows carousel dots and mid-image arrows when multiple photos exist", () => {
    const viewModel = createHouseFinchJournal();
    const secondPhoto = {
      ...viewModel.defaultPhoto,
      id: "photo-house-finch-002",
      altText: "House Finch close look",
      files: {
        ...viewModel.defaultPhoto.files,
        full: "docs/fixtures/web-images/house-finch-card.jpg"
      }
    };

    render(
      <CreatureJournalPage
        viewModel={{
          ...viewModel,
          carouselPhotos: [viewModel.defaultPhoto, secondPhoto]
        }}
      />
    );

    expect(screen.getByLabelText("Previous photo")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Next photo"));

    expect(screen.getByRole("img", { name: /House Finch close look/i })).toHaveAttribute(
      "src",
      "/fixtures/web-images/house-finch-card.jpg"
    );
    expect(screen.getAllByLabelText(/Photo \d of 2/i)).toHaveLength(2);
  });

  it("expands tag families when family controls are clicked", () => {
    render(<CreatureJournalPage viewModel={createHouseFinchJournal()} />);

    fireEvent.click(screen.getByRole("button", { name: /Safety/i }));

    expect(screen.getByRole("button", { name: /Safety/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("Keep Distance")).toBeInTheDocument();
    expect(screen.queryByText("Flying")).not.toBeInTheDocument();
  });

  it("collapses adult science by default and renders fixture citations", () => {
    render(<CreatureJournalPage viewModel={createHouseFinchJournal()} />);

    const science = screen.getByTestId("adult-science");

    expect(science).not.toHaveAttribute("open");
    expect(
      within(science).getByText(/Fixture placeholder/i)
    ).toBeInTheDocument();
    expect(
      within(science).getByRole("link", { name: /Source image validation page/i })
    ).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/File:House_Finch_(male)_(23934285480).jpg"
    );
  });

  it("renders the fixture history table and owner-only notes placeholder", () => {
    const viewModel = createHouseFinchJournal();
    const { rerender } = render(<CreatureJournalPage viewModel={viewModel} />);

    expect(screen.queryByText("Owner Notes")).not.toBeInTheDocument();

    rerender(<CreatureJournalPage viewModel={viewModel} showOwnerNotes />);

    const history = screen.getByRole("table", { name: /Creature journal history/i });

    expect(within(history).getByText("First fixture record created")).toBeInTheDocument();
    expect(within(history).getAllByText("Jun 29, 2026")).toHaveLength(2);
    expect(screen.getByText("Owner Notes")).toBeInTheDocument();
    expect(screen.getByText(/private owner notes will live here/i)).toBeInTheDocument();
  });
});
