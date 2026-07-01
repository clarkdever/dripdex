import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { canViewPrivateJournalQueue } from "./journal-access";
import { createOwnerPasswordHash, createOwnerSessionToken } from "./owner-auth";
import { createPrivateJournalQueuePageViewModel } from "./journal-page-data";
import { PrivateJournalQueuePage } from "./journal-dashboard";

function renderJournalQueue() {
  render(<PrivateJournalQueuePage viewModel={createPrivateJournalQueuePageViewModel()} />);
}

describe("PrivateJournalQueuePage", () => {
  it("keeps the private journal route closed unless the owner has a valid session", () => {
    const env = {
      DRIPDEX_OWNER_USERNAME: "field-owner",
      DRIPDEX_OWNER_PASSWORD_HASH: createOwnerPasswordHash("secret password", {
        salt: "journal-test-salt",
        cost: 1024
      }),
      DRIPDEX_AUTH_SECRET: "journal-test-auth-secret-that-is-long-enough"
    };
    const sessionToken = createOwnerSessionToken({
      env,
      now: new Date("2026-07-01T12:00:00.000Z"),
      username: "field-owner"
    });

    expect(canViewPrivateJournalQueue({ env })).toBe(false);
    expect(
      canViewPrivateJournalQueue({
        env,
        now: new Date("2026-07-01T13:00:00.000Z"),
        sessionToken
      })
    ).toBe(true);
    expect(
      canViewPrivateJournalQueue({
        env,
        now: new Date("2026-07-02T01:00:01.000Z"),
        sessionToken
      })
    ).toBe(false);
  });

  it("renders the fixture-backed private journal queue as the default owner tab", () => {
    renderJournalQueue();

    expect(screen.getByRole("heading", { name: "Private Journal" })).toBeInTheDocument();
    expect(screen.getByText("Private Field Journal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Queue" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    const summary = screen.getByRole("region", { name: /private journal summary/i });
    expect(within(summary).getByRole("article", { name: "Drafts: 1" })).toBeInTheDocument();
    expect(within(summary).getByRole("article", { name: "Mysteries: 1" })).toBeInTheDocument();
    expect(within(summary).getByRole("article", { name: "To Check: 13" })).toBeInTheDocument();
  });

  it("offers a logout action for the signed-in owner", () => {
    renderJournalQueue();
    const logoutButton = screen.getByRole("button", { name: "Log Out" });

    expect(logoutButton.closest("form")).toHaveAttribute("action", "/logout");
    expect(logoutButton.closest("form")).toHaveAttribute("method", "post");
  });

  it("shows drafts, mysteries, and pending review states in Needs Your Eye", () => {
    renderJournalQueue();

    const queue = screen.getByRole("region", { name: /needs your eye/i });
    const falseWidow = within(queue).getByRole("article", {
      name: /finish false widow draft/i
    });
    const questionShelf = within(queue).getByRole("article", {
      name: /question shelf mystery/i
    });
    const sourceCheck = within(queue).getByRole("article", {
      name: /american snout source check/i
    });

    expect(within(falseWidow).getByText("Draft needs owner review")).toBeInTheDocument();
    expect(within(questionShelf).getByText("Mystery needs ID review")).toBeInTheDocument();
    expect(within(sourceCheck).getByText("Source check pending")).toBeInTheDocument();
    expect(within(sourceCheck).getByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/creatures/american-snout"
    );
  });

  it("makes public and private preview states explicit", () => {
    renderJournalQueue();

    const queue = screen.getByRole("region", { name: /needs your eye/i });
    const falseWidow = within(queue).getByRole("article", {
      name: /finish false widow draft/i
    });
    const questionShelf = within(queue).getByRole("article", {
      name: /question shelf mystery/i
    });

    expect(within(falseWidow).getByText("Private only")).toBeInTheDocument();
    expect(
      within(falseWidow).getByText("Public preview: hidden until publish")
    ).toBeInTheDocument();
    expect(within(questionShelf).getByText("Public preview")).toBeInTheDocument();
    expect(
      within(questionShelf).getByText("Public preview: mystery card only")
    ).toBeInTheDocument();
    expect(screen.queryByText(/exact gps/i)).not.toBeInTheDocument();
  });
});
