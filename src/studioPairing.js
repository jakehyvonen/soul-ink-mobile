/**
 * Descriptor: exchanges one fragment-only Studio pairing secret for controller admissions.
 * Usage: remote Soul Ink Mobile prepares this service before creating SigmundClient.
 */

const SESSION_STORAGE_KEY = "soul-ink-mobile-session";
const tokenPattern = /^[A-Za-z0-9_-]{43,1009}$/;
const admissionPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const sessionPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,250}$/;
const machinePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const pairingClaimAttempts = 47;
const pairingRetryDelayMs = 1009;

/** Pause briefly while an authenticated viewing socket finishes registering. */
function waitForPairingHost(delayMs) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
}

/** Validate the credential-free public fields needed by the mobile application. */
function validateSession(value) {
  if (!value || typeof value !== "object" || !sessionPattern.test(String(value.id || ""))) {
    throw new Error("The paired session response is invalid.");
  }
  if (!machinePattern.test(String(value.machineId || "")) || !Number.isFinite(Date.parse(String(value.expiresAt || "")))) {
    throw new Error("The paired session response is invalid.");
  }
  return value;
}

/** Validate one short-lived WebSocket admission without retaining it in browser storage. */
function validateAdmission(value, expectedMachineId) {
  if (!value || typeof value !== "object" || !admissionPattern.test(String(value.ticket || "")) || String(value.ticket).length > 2003) {
    throw new Error("The controller admission is invalid.");
  }
  const expiresAt = Date.parse(String(value.expiresAt || ""));
  const socketUrl = new URL(String(value.websocketUrl || ""));
  if (
    socketUrl.protocol !== "wss:" ||
    socketUrl.pathname !== `/v1/machines/${expectedMachineId}/socket` ||
    socketUrl.search ||
    socketUrl.hash ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    throw new Error("The controller admission is invalid.");
  }
  return value;
}

/** Read the one-time URL fragment and remove it before any network request. */
export function consumePairingToken(locationValue = globalThis.location, historyValue = globalThis.history) {
  const parameters = new URLSearchParams(String(locationValue.hash || "").replace(/^#/, ""));
  const token = parameters.get("pair") || "";
  if (locationValue.hash) {
    historyValue.replaceState(null, "", `${locationValue.pathname}${locationValue.search}`);
  }
  if (!token) return "";
  if (!tokenPattern.test(token)) throw new Error("This pairing link is invalid.");
  return token;
}

/** Parse one no-store Studio API response without reflecting server detail. */
async function readResponse(response) {
  if (!response.ok) {
    const message = response.status === 409
      ? "The Studio viewing device did not reconnect. Keep it open, then refresh this page to retry the same pairing."
      : "This pairing is unavailable or expired.";
    throw new Error(message);
  }
  return response.json();
}

/** Own one public session ID and memory-only admissions backed by an HttpOnly cookie. */
export class StudioPairing {
  /** Configure browser services while keeping the pairing secret memory-only. */
  constructor(options = {}) {
    this.fetchImpl = options.fetchImpl || globalThis.fetch.bind(globalThis);
    this.locationValue = options.locationValue || globalThis.location;
    this.historyValue = options.historyValue || globalThis.history;
    this.storage = options.storage || globalThis.sessionStorage;
    this.waitImpl = options.waitImpl || waitForPairingHost;
    this.firstAdmission = null;
    this.session = null;
  }

  /** Claim a fragment once or restore a cookie-backed session ID after reload. */
  async prepare() {
    const pairingToken = consumePairingToken(this.locationValue, this.historyValue);
    if (pairingToken) {
      let response;
      for (let attempt = 0; attempt < pairingClaimAttempts; attempt += 1) {
        response = await this.fetchImpl("/api/control-pairings/claim", {
          body: JSON.stringify({ pairingToken }),
          cache: "no-store",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        if (response.ok || response.status !== 409 || attempt === pairingClaimAttempts - 1) break;
        await this.waitImpl(pairingRetryDelayMs);
      }
      const result = await readResponse(response);
      this.session = validateSession(result.session);
      this.firstAdmission = validateAdmission(result.admission, this.session.machineId);
      this.storage.setItem(SESSION_STORAGE_KEY, this.session.id);
      return this.session;
    }
    const storedSessionId = this.storage.getItem(SESSION_STORAGE_KEY) || "";
    if (!sessionPattern.test(storedSessionId)) {
      this.storage.removeItem(SESSION_STORAGE_KEY);
      throw new Error("Scan the QR code on your viewing device to pair Soul Ink Mobile.");
    }
    this.session = { id: storedSessionId };
    this.firstAdmission = await this.getAdmission();
    return this.session;
  }

  /** Return the first claim admission once, then use the server-only controller cookie. */
  async getAdmission() {
    if (this.firstAdmission) {
      const admission = this.firstAdmission;
      this.firstAdmission = null;
      return admission;
    }
    if (!this.session?.id) throw new Error("Controller pairing is required.");
    const response = await this.fetchImpl(`/api/control-sessions/${encodeURIComponent(this.session.id)}/ticket`, {
      body: "{}",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    try {
      const result = await readResponse(response);
      this.session = validateSession(result.session);
      return validateAdmission(result.admission, this.session.machineId);
    } catch (error) {
      this.storage.removeItem(SESSION_STORAGE_KEY);
      throw error;
    }
  }
}
