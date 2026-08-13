/**
 * Descriptor: route-selection coverage for the standalone phone sensor diagnostic.
 * Usage: Vitest keeps ordinary Mobile entry and ?sensor-test=1 behavior distinct.
 */
import { describe, expect, it } from "vitest";
import { sensorCheckRequested } from "./PhoneSensorCheck.jsx";

describe("sensorCheckRequested", () => {
  it("enables only the explicit standalone diagnostic", () => {
    expect(sensorCheckRequested("?sensor-test=1")).toBe(true);
    expect(sensorCheckRequested("?sensor-test=0")).toBe(false);
    expect(sensorCheckRequested("")).toBe(false);
  });
});
