/**
 * Descriptor: Browser and pointer safety-exit tests for continuous PBM controls.
 * Usage: `npm test` proves UI exits invoke explicit stops.
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HoldControlButton from "./components/HoldControlButton.jsx";
import LandscapeRequiredScreen from "./components/LandscapeRequiredScreen.jsx";
import StatusStrip from "./components/StatusStrip.jsx";
import { enterPaintingFullscreen, stopPaintingAndExitFullscreen } from "./sessionControl.js";
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

  it("enters fullscreen before requesting a landscape orientation lock", async () => {
    const order = [];
    const fullscreen = { enter: vi.fn(async () => { order.push("fullscreen"); }) };
    const display = { orientation: { lock: vi.fn(async () => { order.push("landscape"); }) } };

    await expect(enterPaintingFullscreen(fullscreen, display)).resolves.toBe(true);

    expect(display.orientation.lock).toHaveBeenCalledWith("landscape");
    expect(order).toEqual(["fullscreen", "landscape"]);
  });

  it("keeps painting usable through the rotate gate when orientation locking is unavailable", async () => {
    const fullscreen = { enter: vi.fn(async () => undefined) };
    const display = { orientation: { lock: vi.fn(async () => { throw new Error("unsupported"); }) } };

    await expect(enterPaintingFullscreen(fullscreen, display)).resolves.toBe(false);
  });

  it("unlocks and exits fullscreen while immediately stopping continuous controls", async () => {
    let finishExit;
    const fullscreen = { exit: vi.fn(() => new Promise((resolve) => { finishExit = resolve; })) };
    const client = { stopContinuous: vi.fn() };
    const display = { orientation: { unlock: vi.fn() } };

    const ending = stopPaintingAndExitFullscreen(fullscreen, client, display);

    expect(fullscreen.exit).toHaveBeenCalledOnce();
    expect(client.stopContinuous).toHaveBeenCalledWith("session end");
    expect(display.orientation.unlock).toHaveBeenCalledOnce();
    finishExit();
    await ending;
  });

  it("retains Stop All and End Painting on the portrait safety gate", () => {
    const stopAll = vi.fn();
    const endPainting = vi.fn();
    const copy = {
      endPainting: "End Painting",
      landscapeRequiredBody: "Turn your phone sideways.",
      landscapeRequiredTitle: "Rotate your phone",
      stopAll: "STOP ALL",
    };
    const { getByRole } = render(<LandscapeRequiredScreen connected copy={copy} onEndPainting={endPainting} onStopAll={stopAll} />);

    fireEvent.click(getByRole("button", { name: "STOP ALL" }));
    fireEvent.click(getByRole("button", { name: "End Painting" }));

    expect(stopAll).toHaveBeenCalledOnce();
    expect(endPainting).toHaveBeenCalledOnce();
  });
});

describe("compact control status", () => {
  const copy = { health: "Health", label: "Sigmund status", lease: "Lease", link: "Link", readOnly: "read-only", ready: "Sigmund ready", recording: "Recording motif", session: "Session" };

  /** Build one renderable status snapshot. Usage: compact header assertions. */
  function statusState(overrides = {}) {
    return {
      connection: "connected",
      health: "healthy",
      lease: { owned: true },
      recording: { active: false },
      session: { active: true, status: "active" },
      ...overrides,
    };
  }

  it("collapses healthy details into one ready badge", () => {
    const { getByText, queryByText } = render(<StatusStrip state={statusState()} copy={copy} />);

    expect(getByText("Sigmund ready")).toBeInTheDocument();
    expect(queryByText(/Link:/)).not.toBeInTheDocument();
    expect(queryByText(/Lease:/)).not.toBeInTheDocument();
  });

  it("shows only connection states that require attention", () => {
    const { getByText, queryByText } = render(<StatusStrip state={statusState({ connection: "disconnected" })} copy={copy} />);

    expect(getByText("Link: disconnected")).toBeInTheDocument();
    expect(queryByText("Sigmund ready")).not.toBeInTheDocument();
  });
});
