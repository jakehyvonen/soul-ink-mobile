/**
 * Descriptor: runtime configuration tests for local and paired Soul Ink Mobile deployments.
 * Usage: `npm test` verifies public configuration cannot silently weaken transport.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRuntimeConfig, resolveControlUrl, validateRuntimeConfig } from "./runtimeConfig.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runtime configuration", () => {
  it("defaults to local unauthenticated control", () => {
    const config = validateRuntimeConfig({});
    expect(config.mode).toBe("local");
    expect(config.auth).toBe("none");
  });

  it("requires Studio pairing for remote mode", () => {
    expect(() => validateRuntimeConfig({ mode: "remote", auth: "none" })).toThrow(/pairing/);
    expect(validateRuntimeConfig({ mode: "remote", auth: "pairing", machineId: "" })).toMatchObject({
      auth: "pairing",
      mode: "remote",
    });
  });

  it("rejects insecure optional remote socket overrides", () => {
    expect(() => validateRuntimeConfig({ mode: "remote", auth: "pairing", controlUrl: "ws://relay.test/ws" })).toThrow(/wss/);
  });

  it("derives the local socket from the current secure origin", () => {
    const config = validateRuntimeConfig({});
    expect(resolveControlUrl(config, { protocol: "https:", host: "sigmund.local" })).toBe("wss://sigmund.local/ws");
  });

  it("keeps the browser receiver when loading deployment configuration", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(function () {
      expect(this).toBe(globalThis);
      return Promise.resolve({
        json: async () => ({ mode: "local", auth: "none", machineId: "sigmund-local" }),
        ok: true,
      });
    });

    await expect(loadRuntimeConfig()).resolves.toMatchObject({ mode: "local" });
  });
});
