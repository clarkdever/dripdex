import { fireEvent, render, screen, within, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CaptureEntryPage } from "./capture-entry";

function mockPreviewBounds() {
  const preview = screen.getByLabelText("Shared capture preview target");

  vi.spyOn(preview, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 400,
    right: 500,
    width: 500,
    height: 400,
    toJSON: () => ({})
  });

  return preview;
}

describe("CaptureEntryPage", () => {
  it("keeps the empty preview out of the keyboard button flow", () => {
    render(<CaptureEntryPage />);

    const preview = screen.getByLabelText("Shared capture preview target");

    expect(preview).not.toHaveAttribute("role", "button");
    expect(preview).not.toHaveAttribute("tabindex");
  });

  it("converges upload and scanner entry buttons into the same preview", () => {
    const { rerender } = render(<CaptureEntryPage />);

    fireEvent.click(screen.getByRole("button", { name: /upload photo/i }));

    expect(screen.getByRole("region", { name: /capture preview/i })).toHaveAttribute(
      "data-source",
      "upload"
    );
    expect(screen.getByText("Tap the subject")).toBeInTheDocument();

    rerender(<CaptureEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: /open scanner/i }));

    expect(screen.getByRole("region", { name: /capture preview/i })).toHaveAttribute(
      "data-source",
      "scanner"
    );
    expect(screen.getByText("Tap the subject")).toBeInTheDocument();
  });

  it("records normalized subject tap coordinates and completes the target lock copy", () => {
    vi.useFakeTimers();
    render(<CaptureEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: /upload photo/i }));

    const preview = mockPreviewBounds();
    fireEvent.click(preview, {
      clientX: 125,
      clientY: 300
    });

    const status = screen.getByRole("status");
    expect(within(status).getByText("Thank you for your help")).toBeInTheDocument();
    expect(screen.getByText("x 0.25 / y 0.88")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(within(status).getByText("Subject Located")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("normalizes taps against the visible contained image area", () => {
    vi.useFakeTimers();
    render(<CaptureEntryPage />);
    fireEvent.click(screen.getByRole("button", { name: /upload photo/i }));

    const preview = mockPreviewBounds();
    act(() => {
      fireEvent.load(screen.getByRole("img", { name: /texas spiny lizard preview/i }), {
        currentTarget: {
          naturalWidth: 800,
          naturalHeight: 420
        }
      });
    });
    fireEvent.click(preview, {
      clientX: 250,
      clientY: 134.375
    });

    expect(screen.getByText("x 0.50 / y 0.25")).toBeInTheDocument();
    expect(document.querySelector(".capture-crosshair")).toHaveStyle({
      left: "50%",
      top: "33.59375%"
    });
    vi.useRealTimers();
  });
});
