import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the DripDex public landing route", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /hill country dripdex/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/gotta catch'em y'all/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a personal texas hill country field journal/i)
    ).toBeInTheDocument();
  });
});
