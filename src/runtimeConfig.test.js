/**
 * Descriptor: Runtime configuration tests for local and remote PBM deployments.
 * Usage: `npm test` verifies public configuration cannot silently weaken transport.
 */
import { describe, expect, it } from "vitest";
import { resolveControlUrl, validateRuntimeConfig } from "./runtimeConfig.js";

describe("runtime configuration", () => {
  it("defaults to local unauthenticated control", () => {
    const config = validateRuntimeConfig({});
    expect(config.mode).toBe("local");
    expect(config.auth).toBe("none");
  });

  it("requires secure relay WebSockets", () => {
    expect(() => validateRuntimeConfig({ mode: "remote", controlUrl: "ws://relay.test/ws" })).toThrow(/wss/);
  });

  it("requires only publishable Supabase browser settings", () => {
    expect(() => validateRuntimeConfig({ auth: "supabase" })).toThrow(/Supabase/);
    const config = validateRuntimeConfig({
      auth: "supabase",
      supabaseUrl: "https://project.supabase.co",
      supabasePublishableKey: "publishable-test",
    });
    expect(Object.keys(config)).not.toContain("serviceRoleKey");
  });

  it("derives the local socket from the current secure origin", () => {
    const config = validateRuntimeConfig({});
    expect(resolveControlUrl(config, { protocol: "https:", host: "sigmund.local" })).toBe("wss://sigmund.local/ws");
  });
});
