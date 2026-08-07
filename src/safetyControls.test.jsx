/**
 * Descriptor: Browser and pointer safety-exit tests for continuous PBM controls.
 * Usage: `npm test` proves UI exits invoke explicit stops.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HoldControlButton from "./components/HoldControlButton.jsx";

describe("continuous-control pointer safety", () => {
  it.each(["pointerUp", "pointerCancel", "lostPointerCapture"])("stops on %s", (eventName) => {
    const start = vi.fn();
    const stop = vi.fn();
    const { getByRole } = render(<HoldControlButton onStart={start} onStop={stop}>Hold</HoldControlButton>);
    const button = getByRole("button");
    fireEvent.pointerDown(button, { pointerId: 107 });
    fireEvent[eventName](button, { pointerId: 107 });
    expect(start).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalled();
  });
});
