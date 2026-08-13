/**
 * Descriptor: deterministic verification of the opt-in Mobile small-motion check.
 * Usage: Vitest proves query gating and mandatory XY neutralization.
 */
import { describe, expect, it, vi } from "vitest";
import { motionCheckRequested, runMotionCheck, runRotaryCheck, runTiltCheck } from "./motionCheck.js";

describe("motionCheckRequested", () => {
  it("requires the explicit query opt-in", () => {
    expect(motionCheckRequested("?motion-check=1")).toBe(true);
    expect(motionCheckRequested("?motion-check=0")).toBe(false);
    expect(motionCheckRequested("")).toBe(false);
  });
});

describe("runMotionCheck", () => {
  it("sends the requested vector and always neutralizes it", async () => {
    const client = { setControl: vi.fn(), clearControl: vi.fn() };
    const wait = vi.fn().mockResolvedValue(undefined);

    await runMotionCheck(client, { x_ratio: 0.19, y_ratio: 0 }, wait);

    expect(client.setControl).toHaveBeenCalledWith("xy_joystick", { x_ratio: 0.19, y_ratio: 0 });
    expect(wait).toHaveBeenCalledOnce();
    expect(client.clearControl).toHaveBeenCalledWith("xy_joystick");
  });

  it("neutralizes the channel when the timer fails", async () => {
    const client = { setControl: vi.fn(), clearControl: vi.fn() };
    const wait = vi.fn().mockRejectedValue(new Error("timer failed"));

    await expect(runMotionCheck(client, { x_ratio: 0, y_ratio: -0.19 }, wait)).rejects.toThrow("timer failed");
    expect(client.clearControl).toHaveBeenCalledWith("xy_joystick");
  });
});

describe("table motion checks", () => {
  it("sends one exact direct tilt target", () => {
    const client = { setControl: vi.fn() };
    runTiltCheck(client, { u_ratio: 11 / 31, v_ratio: 0 });
    expect(client.setControl).toHaveBeenCalledWith("table_tilt", { u_ratio: 11 / 31, v_ratio: 0 });
  });

  it("always stops one bounded rotary pulse", async () => {
    const client = { setControl: vi.fn(), clearControl: vi.fn() };
    const wait = vi.fn().mockResolvedValue(undefined);
    await runRotaryCheck(client, -1, wait);
    expect(client.setControl).toHaveBeenCalledWith("table_rotation", { velocity_ratio: -0.11 });
    expect(wait).toHaveBeenCalledOnce();
    expect(client.clearControl).toHaveBeenCalledWith("table_rotation");
  });
});
