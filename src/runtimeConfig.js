/**
 * Descriptor: Validates the unbundled deployment settings used by PBM.
 * Usage: App loads runtime-config.json before creating authentication or transport.
 */

export const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  mode: "local",
  controlUrl: "",
  machineId: "sigmund-local",
  auth: "none",
  supabaseUrl: "",
  supabasePublishableKey: "",
});

/**
 * Normalize and validate runtime configuration without accepting secrets.
 * Usage: pass parsed runtime-config.json before constructing SigmundClient.
 */
export function validateRuntimeConfig(candidate = {}) {
  const config = { ...DEFAULT_RUNTIME_CONFIG, ...candidate };
  if (!new Set(["local", "remote"]).has(config.mode)) {
    throw new Error("runtime mode must be local or remote");
  }
  if (!new Set(["none", "supabase"]).has(config.auth)) {
    throw new Error("runtime auth must be none or supabase");
  }
  if (!String(config.machineId || "").trim()) {
    throw new Error("runtime machineId is required");
  }
  if (config.mode === "remote" && !String(config.controlUrl || "").startsWith("wss://")) {
    throw new Error("remote controlUrl must use wss://");
  }
  if (config.auth === "supabase" && (!config.supabaseUrl || !config.supabasePublishableKey)) {
    throw new Error("Supabase URL and publishable key are required for Supabase auth");
  }
  return Object.freeze({
    mode: config.mode,
    controlUrl: String(config.controlUrl || ""),
    machineId: String(config.machineId),
    auth: config.auth,
    supabaseUrl: String(config.supabaseUrl || ""),
    supabasePublishableKey: String(config.supabasePublishableKey || ""),
  });
}

/**
 * Fetch the deployment configuration with cache bypass so endpoint changes are immediate.
 * Usage: call once during application bootstrap; pass a test fetch implementation when needed.
 */
export async function loadRuntimeConfig(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(new URL("./runtime-config.json", document.baseURI), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`runtime configuration failed with HTTP ${response.status}`);
  }
  return validateRuntimeConfig(await response.json());
}

/**
 * Resolve the native WebSocket endpoint for local subpath or remote relay use.
 * Usage: SigmundClient calls this for each connection attempt.
 */
export function resolveControlUrl(config, locationValue = globalThis.location) {
  if (config.controlUrl) {
    return config.controlUrl;
  }
  const protocol = locationValue.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${locationValue.host}/ws`;
}
