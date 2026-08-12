/**
 * Descriptor: one-time fragment claim and cookie-backed reconnect tests.
 * Usage: npm test verifies QR secrets leave browser history before exchange.
 */

import { describe, expect, it, vi } from "vitest";
import { consumePairingToken, StudioPairing } from "./studioPairing.js";

const pairingToken = "q".repeat(83);
const admissionTicket = `${"a".repeat(53)}.${"b".repeat(53)}`;

/** Build one valid public claim response without cookie or QR credentials. */
function claimResponse() {
  return {
    admission: {
      expiresAt: new Date(Date.now() + 19_001).toISOString(),
      ticket: admissionTicket,
      websocketUrl: "wss://control.soul-ink.art/v1/machines/sigmund/socket",
    },
    session: {
      controllerPresent: true,
      expiresAt: new Date(Date.now() + 7_620_013).toISOString(),
      hostPresent: true,
      id: "control-session-127",
      machineId: "sigmund",
      pairExpiresAt: null,
      state: "active",
    },
  };
}

describe("StudioPairing", () => {
  it("removes a fragment before returning its valid token", () => {
    const historyValue = { replaceState: vi.fn() };
    const token = consumePairingToken(
      { hash: `#pair=${pairingToken}`, pathname: "/mobile/", search: "" },
      historyValue,
    );
    expect(token).toBe(pairingToken);
    expect(historyValue.replaceState).toHaveBeenCalledWith(null, "", "/mobile/");
  });

  it("claims once and keeps the first admission only in memory", async () => {
    const order = [];
    const historyValue = { replaceState: vi.fn(() => order.push("fragment removed")) };
    const storage = { getItem: vi.fn(), removeItem: vi.fn(), setItem: vi.fn() };
    const fetchImpl = vi.fn(async () => {
      order.push("claim posted");
      return { ok: true, json: async () => claimResponse() };
    });
    const service = new StudioPairing({
      fetchImpl,
      historyValue,
      locationValue: { hash: `#pair=${pairingToken}`, pathname: "/mobile/", search: "" },
      storage,
    });

    await expect(service.prepare()).resolves.toMatchObject({ id: "control-session-127" });
    await expect(service.getAdmission()).resolves.toMatchObject({ ticket: admissionTicket });
    expect(order).toEqual(["fragment removed", "claim posted"]);
    expect(storage.setItem).toHaveBeenCalledWith("soul-ink-mobile-session", "control-session-127");
    expect(storage.setItem).not.toHaveBeenCalledWith(expect.anything(), pairingToken);
  });

  it("retries a valid claim while the viewing socket finishes connecting", async () => {
    const waitImpl = vi.fn(async () => undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValueOnce({ ok: true, json: async () => claimResponse(), status: 200 });
    const service = new StudioPairing({
      fetchImpl,
      historyValue: { replaceState: vi.fn() },
      locationValue: { hash: `#pair=${pairingToken}`, pathname: "/mobile/", search: "" },
      storage: { getItem: vi.fn(), removeItem: vi.fn(), setItem: vi.fn() },
      waitImpl,
    });

    await expect(service.prepare()).resolves.toMatchObject({ id: "control-session-127" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).toHaveBeenCalledWith(503);
  });

  it("keeps the browser receiver for default claim requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(function () {
      expect(this).toBe(globalThis);
      return Promise.resolve({ ok: true, json: async () => claimResponse() });
    });
    const service = new StudioPairing({
      historyValue: { replaceState: vi.fn() },
      locationValue: { hash: `#pair=${pairingToken}`, pathname: "/mobile/", search: "" },
      storage: { getItem: vi.fn(), removeItem: vi.fn(), setItem: vi.fn() },
    });

    try {
      await service.prepare();
      expect(fetchSpy).toHaveBeenCalledOnce();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("uses only the HttpOnly-cookie ticket route after reload", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => claimResponse() }));
    const storage = {
      getItem: vi.fn(() => "control-session-127"),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    };
    const service = new StudioPairing({
      fetchImpl,
      historyValue: { replaceState: vi.fn() },
      locationValue: { hash: "", pathname: "/mobile/", search: "" },
      storage,
    });

    await service.prepare();
    await service.getAdmission();
    expect(fetchImpl).toHaveBeenCalledWith("/api/control-sessions/control-session-127/ticket", expect.objectContaining({ credentials: "same-origin" }));
  });
});
