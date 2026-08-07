/**
 * Descriptor: Browser and pointer safety-exit tests for continuous PBM controls.
 * Usage: `npm test` proves UI exits invoke explicit stops.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HoldControlButton from "./components/HoldControlButton.jsx";
import { routeXyVector } from "./xyControl.js";

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

  it("keeps the disabled joystick silent until a session owns control", () => {
    const client = { setControl: vi.fn(), clearControl: vi.fn() };

    routeXyVector(client, false, { x_ratio: 0, y_ratio: 0 });

    expect(client.setControl).not.toHaveBeenCalled();
    expect(client.clearControl).not.toHaveBeenCalled();
  });

  it("samples active XY intent and sends one explicit release stop", () => {
    const client = { setControl: vi.fn(), clearControl: vi.fn() };

    routeXyVector(client, true, { x_ratio: 0.5, y_ratio: -0.25 });
    routeXyVector(client, true, { x_ratio: 0, y_ratio: 0 });

    expect(client.setControl).toHaveBeenCalledOnce();
    expect(client.setControl).toHaveBeenCalledWith("xy_joystick", { x_ratio: 0.5, y_ratio: -0.25 });
    expect(client.clearControl).toHaveBeenCalledOnce();
    expect(client.clearControl).toHaveBeenCalledWith("xy_joystick");
  });
});
