import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CollectionPage } from "./collection-view";
import { createCollectionPageViewModel } from "./collection-page-data";

function renderCollection() {
  return render(<CollectionPage viewModel={createCollectionPageViewModel()} />);
}

describe("public intro panel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "dripdex_public_intro_hidden=; max-age=0; path=/";
  });

  it("shows Hide Intro as the primary CTA and Learn More as the secondary CTA", () => {
    renderCollection();

    const intro = screen.getByRole("region", { name: /about dripdex/i });
    expect(intro).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Intro" })).toHaveClass(
      "public-intro__hide"
    );
    expect(screen.getByRole("link", { name: "Learn More" })).toHaveClass(
      "public-intro__learn"
    );
  });

  it("keeps the dismissed intro hidden after reload", () => {
    const { unmount } = renderCollection();

    fireEvent.click(screen.getByRole("button", { name: "Hide Intro" }));

    expect(screen.queryByRole("region", { name: /about dripdex/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem("dripdex_public_intro_hidden")).toBe("1");

    unmount();
    renderCollection();

    expect(screen.queryByRole("region", { name: /about dripdex/i })).not.toBeInTheDocument();
  });

  it("keeps the intro hidden when only the dismissal cookie exists", () => {
    document.cookie = "dripdex_public_intro_hidden=1; path=/";

    renderCollection();

    expect(screen.queryByRole("region", { name: /about dripdex/i })).not.toBeInTheDocument();
  });

  it("falls back to the dismissal cookie when local storage is unavailable", () => {
    const getItem = window.localStorage.getItem;
    const setItem = window.localStorage.setItem;
    Object.defineProperty(window.localStorage, "getItem", {
      configurable: true,
      value: () => {
        throw new Error("Storage disabled");
      }
    });
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: () => {
        throw new Error("Storage disabled");
      }
    });

    renderCollection();

    fireEvent.click(screen.getByRole("button", { name: "Hide Intro" }));

    expect(screen.queryByRole("region", { name: /about dripdex/i })).not.toBeInTheDocument();
    expect(document.cookie).toContain("dripdex_public_intro_hidden=1");

    Object.defineProperty(window.localStorage, "getItem", {
      configurable: true,
      value: getItem
    });
    Object.defineProperty(window.localStorage, "setItem", {
      configurable: true,
      value: setItem
    });
  });
});
