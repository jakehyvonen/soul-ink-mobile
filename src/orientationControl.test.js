/**
 * Descriptor: deterministic coverage for calibrated phone-orientation tilt mapping.
 * Usage: Vitest verifies neutral calibration, limits, smoothing, deadband, and landscape axes.
 */
import { describe, expect, it } from "vitest";
import { OrientationTracker, screenRelativeAngles, TILT_RANGE_DEGREES } from "./orientationControl.js";

/** Feed one steady sample enough times for the smoothing filter to settle. Usage: mapping assertions. */
function settle(tracker, event, screenAngle = 0) {
  let result;
  for (let index = 0; index < 31; index += 1) result = tracker.update(event, screenAngle);
  return result;
}

describe("screenRelativeAngles", () => {
  it("keeps portrait axes and rotates landscape coordinates", () => {
    expect(screenRelativeAngles({ beta: 11, gamma: 7 }, 0)).toEqual({ u: 11, v: 7 });
    expect(screenRelativeAngles({ beta: 11, gamma: 7 }, 90)).toEqual({ u: -7, v: 11 });
    expect(screenRelativeAngles({ beta: 11, gamma: 7 }, 270)).toEqual({ u: 7, v: -11 });
  });
});

describe("OrientationTracker", () => {
  it("uses the first phone pose as neutral and ignores its absolute attitude", () => {
    const tracker = new OrientationTracker();
    expect(tracker.update({ beta: 47, gamma: -23 })).toMatchObject({
      calibrated: true,
      ratios: { u_ratio: 0, v_ratio: 0 },
    });
  });

  it("ignores empty sensor frames and recalibrates after screen rotation", () => {
    const tracker = new OrientationTracker();
    expect(tracker.update({ beta: null, gamma: null }).calibrated).toBe(false);
    tracker.update({ beta: 17, gamma: 19 }, 0);
    const rotated = tracker.update({ beta: 19, gamma: -17 }, 90);
    expect(rotated.ratios).toEqual({ u_ratio: 0, v_ratio: 0 });
  });

  it("maps relative 11 degree U/V motion while retaining physical limits", () => {
    const tracker = new OrientationTracker();
    tracker.calibrate({ beta: 31, gamma: -17 });
    const result = settle(tracker, { beta: 42, gamma: -6 });

    expect(result.degrees.u).toBeCloseTo(11, 1);
    expect(result.degrees.v).toBeCloseTo(11, 1);
    expect(result.ratios.u_ratio).toBeCloseTo(11 / TILT_RANGE_DEGREES, 2);
    expect(result.ratios.v_ratio).toBeCloseTo(11 / TILT_RANGE_DEGREES, 2);

    const limited = settle(tracker, { beta: 131, gamma: 73 });
    expect(limited.ratios.u_ratio).toBeLessThanOrEqual(1);
    expect(limited.ratios.v_ratio).toBeLessThanOrEqual(1);
  });

  it("holds small sensor jitter in the neutral deadband", () => {
    const tracker = new OrientationTracker();
    tracker.calibrate({ beta: 17, gamma: 19 });
    const result = settle(tracker, { beta: 17.31, gamma: 18.53 });
    expect(result.ratios).toEqual({ u_ratio: 0, v_ratio: 0 });
  });
});
