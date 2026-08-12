/**
 * Descriptor: deterministic tests for the frame-polled Soul Ink Mobile XY joystick values.
 * Usage: npm test verifies visible thumb displacement becomes normalized motion intent.
 */

import { describe, expect, it } from "vitest";
import { joystickVector } from "./joystickVector.js";

describe("joystickVector", () => {
  it("normalizes the plugin displacement into shaped gantry ratios", () => {
    expect(joystickVector({ forceX: 113, forceY: -56.5, radius: 113 })).toEqual({
      x_ratio: -1,
      y_ratio: 0.5 ** 1.7,
    });
  });

  it("returns neutral intent when the joystick is unavailable", () => {
    expect(joystickVector(null)).toEqual({ x_ratio: 0, y_ratio: 0 });
  });
});
