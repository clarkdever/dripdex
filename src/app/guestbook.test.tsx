import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollectionPage } from "./collection-view";
import { createCollectionPageViewModel } from "./collection-page-data";

function renderCollection() {
  return render(<CollectionPage viewModel={createCollectionPageViewModel()} />);
}

function openGuestbook() {
  const summary = screen.getByText(/click to sign our guest book/i).closest("summary");

  expect(summary).not.toBeNull();
  fireEvent.click(summary!);

  return screen.getByRole("region", { name: /guest book entries/i });
}

describe("guestbook moderation stub", () => {
  it("defaults closed and opens when the closed accordion summary is clicked", () => {
    renderCollection();

    const summary = screen.getByText(/click to sign our guest book/i).closest("summary");
    const details = summary?.closest("details");

    expect(summary).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    fireEvent.click(summary!);

    expect(details).toHaveAttribute("open");
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Visiting From")).toBeInTheDocument();
    expect(screen.getByLabelText("Comment")).toBeInTheDocument();
  });

  it("shows a visitor submission as pending until owner approval", () => {
    renderCollection();

    const list = openGuestbook();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Scout Pack" }
    });
    fireEvent.change(screen.getByLabelText("Visiting From"), {
      target: { value: "Wimberley creek walk" }
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "We found a beetle and want more porch light bugs." }
    });
    fireEvent.click(screen.getByRole("button", { name: /sign guest book/i }));

    const rows = within(list).getAllByRole("article");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Added below as pending owner approval."
    );
    expect(within(rows[0]).getByText("Scout Pack")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Wimberley creek walk")).toBeInTheDocument();
    expect(
      within(rows[0]).getByText("We found a beetle and want more porch light bugs.")
    ).toBeInTheDocument();
    expect(within(rows[0]).getByText("Pending")).toBeInTheDocument();
  });

  it("paginates approved entries after the first 50", () => {
    renderCollection();

    const list = openGuestbook();

    expect(within(list).getAllByText("Approved")).toHaveLength(50);
    expect(screen.getByText("Showing 1-50 of 52 approved notes")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(within(list).getAllByText("Approved")).toHaveLength(2);
    expect(screen.getByText("Showing 51-52 of 52 approved notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
