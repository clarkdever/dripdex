import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createFixtureRecords } from "./collection-page-data";
import {
  createMysteryWorkspacePageViewModel,
  toPublicMysteryWorkspaceViewModel
} from "./mystery-page-data";
import { MysteryInvestigationPage } from "./mystery-investigation";
import { buildMysteryWorkspaceViewModel } from "../domain/mystery/mystery-view-model";

function renderMystery() {
  render(
    <MysteryInvestigationPage
      viewModel={createMysteryWorkspacePageViewModel("mystery-white-shelf-fungus")}
    />
  );
}

describe("MysteryInvestigationPage", () => {
  it("renders fixture-backed mystery detail and toggles the image to full color", () => {
    renderMystery();

    expect(screen.getByRole("heading", { name: "Question Shelf" })).toBeInTheDocument();
    expect(screen.getByText("Mystery Investigation")).toBeInTheDocument();
    expect(screen.getByText("Texas Hill Country example fixture")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Question Shelf mystery/i })).toHaveClass(
      "mystery-photo__image--muted"
    );

    fireEvent.click(screen.getByRole("button", { name: /show full color/i }));

    expect(screen.getByRole("img", { name: /Question Shelf mystery/i })).not.toHaveClass(
      "mystery-photo__image--muted"
    );
    expect(screen.getByRole("button", { name: /return to mystery grayscale/i })).toBeInTheDocument();
  });

  it("renders a safe external prompt and EXIF-stripped download action", () => {
    renderMystery();

    fireEvent.click(screen.getByRole("button", { name: "Prompt" }));

    expect(screen.getByRole("heading", { name: "Ask Your Chatbot" })).toBeInTheDocument();
    expect(screen.getByText(/inspect the attached EXIF-stripped photo first/i)).toBeInTheDocument();
    expect(screen.getByText(/private coordinates and home-zone details are omitted/i)).toBeInTheDocument();
    expect(screen.getByText(/Exact GPS hidden from public prompt/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download photo/i })).toHaveAttribute(
      "href",
      "/fixtures/web-images/mystery-white-shelf-fungus-full.jpg"
    );
  });

  it("copies the safe prompt to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });
    const viewModel = createMysteryWorkspacePageViewModel("mystery-white-shelf-fungus");

    render(<MysteryInvestigationPage viewModel={viewModel} />);

    fireEvent.click(screen.getByRole("button", { name: "Prompt" }));
    fireEvent.click(screen.getByRole("button", { name: /copy prompt/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(viewModel?.views.externalHandoff.promptPreview);
    });
    expect(screen.getByText("Prompt copied for external LLM")).toBeInTheDocument();
  });

  it("omits exact private coordinates from the public mystery page model", () => {
    const record = createFixtureRecords().find(
      (candidate) => candidate.creature.id === "mystery-white-shelf-fungus"
    );

    if (!record) {
      throw new Error("Expected mystery-white-shelf-fungus fixture.");
    }

    const privateViewModel = buildMysteryWorkspaceViewModel({
      ...record,
      observations: [
        {
          ...record.observations[0],
          exactLocation: {
            latitude: 30.267153,
            longitude: -97.743057
          }
        },
        ...record.observations.slice(1)
      ]
    });
    const publicViewModel = toPublicMysteryWorkspaceViewModel(privateViewModel);
    const serializedPublicViewModel = JSON.stringify(publicViewModel);

    expect(serializedPublicViewModel).not.toContain("exactLocation");
    expect(serializedPublicViewModel).not.toContain("latitude");
    expect(serializedPublicViewModel).not.toContain("longitude");
    expect(serializedPublicViewModel).not.toContain("30.267153");
    expect(serializedPublicViewModel).not.toContain("-97.743057");
    expect(publicViewModel.views.externalHandoff.promptPreview).not.toContain("30.267153");
    expect(publicViewModel.views.externalHandoff.promptPreview).not.toContain("-97.743057");
  });

  it("does not create a public mystery route model for private mysteries", () => {
    const records = createFixtureRecords();
    const privateMysteryRecords = records.map((record) =>
      record.creature.id === "mystery-white-shelf-fungus"
        ? {
            ...record,
            creature: {
              ...record.creature,
              publicVisibility: "private" as const
            }
          }
        : record
    );

    expect(
      createMysteryWorkspacePageViewModel(
        "mystery-white-shelf-fungus",
        privateMysteryRecords
      )
    ).toBeNull();
  });

  it("accepts pasted resolution text and marks normalization as owner-reviewed candidate work", () => {
    renderMystery();

    fireEvent.click(screen.getByRole("button", { name: "Paste" }));
    fireEvent.change(screen.getByRole("textbox", { name: /paste resolution from llm/i }), {
      target: {
        value:
          "Probably a green lacewing. Confidence around 70%. Compare with brown lacewing."
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /normalize with ai/i }));

    expect(screen.getByDisplayValue(/probably a green lacewing/i)).toBeInTheDocument();
    expect(screen.getByText("Owner review required")).toBeInTheDocument();
    expect(screen.getByText(/candidate suggestion only/i)).toBeInTheDocument();
    expect(screen.getByText(/not an authority/i)).toBeInTheDocument();
  });

  it("limits resolve actions to log, duplicate, or reject suggestion", () => {
    renderMystery();

    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

    const resolvePanel = screen.getByRole("region", { name: /resolve candidate/i });
    expect(within(resolvePanel).getByRole("button", { name: /log to green lacewing entry/i })).toBeInTheDocument();
    expect(within(resolvePanel).getByRole("button", { name: /create duplicate green lacewing entry/i })).toBeInTheDocument();
    expect(within(resolvePanel).getByRole("button", { name: /reject suggestion/i })).toBeInTheDocument();
    expect(within(resolvePanel).getAllByRole("button")).toHaveLength(3);
  });
});
