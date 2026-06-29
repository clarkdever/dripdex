import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the fixture-backed DripDex collection route", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /collection/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gotta catch'em y'all/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: /Texas Spiny Lizard Found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: /Ladder-backed Woodpecker Locked/i })
    ).toBeInTheDocument();
  });
});
