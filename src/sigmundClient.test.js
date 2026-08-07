/**
 * Descriptor: Native transport tests for correlation, sequencing, and safe reconnection.
 * Usage: `npm test` runs these without a live Pi or real WebSocket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROL_SAMPLE_MS, SigmundClient } from "./sigmundClient.js";
import { validateRuntimeConfig } from "./runtimeConfig.js";

/** Minimal controllable WebSocket for transport tests. Usage: SigmundClient dependency injection. */
class FakeWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.listeners = new Map();
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  /** Register one transport listener. Usage: SigmundClient constructor. */
  addEventListener(type, listener) { this.listeners.set(type, listener); }

  /** Open this fake connection. Usage: individual tests. */
  open() { this.readyState = 1; this.listeners.get("open")?.({}); }

  /** Retain one serialized frame. Usage: assertions inspect sent. */
  send(frame) { this.sent.push(JSON.parse(frame)); }

  /** Deliver a server object. Usage: correlated result and lease tests. */
  receive(message) { this.listeners.get("message")?.({ data: JSON.stringify(message) }); }

  /** Close and emit the close event once. Usage: reconnect safety tests. */
  close() {
    const wasOpen = this.readyState !== 3;
    this.readyState = 3;
    if (wasOpen) this.listeners.get("close")?.({});
  }
}

/** Construct a local client with deterministic holder. Usage: transport tests. */
function createClient() {
  return new SigmundClient(validateRuntimeConfig({ controlUrl: "ws://sigmund.local/ws" }), {
    WebSocketImpl: FakeWebSocket,
    holder: "pbm-107",
  });
}

describe("SigmundClient", () => {
  beforeEach(() => { vi.useFakeTimers(); FakeWebSocket.instances = []; });
  afterEach(() => vi.useRealTimers());

  it("connects read-only and samples one latest value with increasing sequence", async () => {
    const client = createClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    expect(socket.url).toContain("auto_lease=false");
    socket.open();
    client.setControl("xy_joystick", { x_ratio: 0.25, y_ratio: -0.5 });
    client.setControl("xy_joystick", { x_ratio: 0.75, y_ratio: -0.25 });
    await vi.advanceTimersByTimeAsync(CONTROL_SAMPLE_MS);
    expect(socket.sent.at(-1)).toMatchObject({ channel: "xy_joystick", sequence: 1, payload: { x_ratio: 0.75, y_ratio: -0.25 } });
    expect(Date.parse(socket.sent.at(-1).expires_at) - Date.parse(socket.sent.at(-1).sent_at)).toBe(503);
    await vi.advanceTimersByTimeAsync(CONTROL_SAMPLE_MS);
    expect(socket.sent.at(-1).sequence).toBe(2);
    client.disconnect();
  });

  it("correlates accepted discrete requests", async () => {
    const client = createClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    const pending = client.sendRequest("painting_session_start");
    const request = socket.sent.at(-1);
    socket.receive({ type: "request.result", request_id: request.request_id, payload: { ok: true, session_id: "session-109" } });
    await expect(pending).resolves.toMatchObject({ session_id: "session-109", request_id: request.request_id });
    client.disconnect();
  });

  it("never resumes a continuous value after reconnect", async () => {
    const client = createClient();
    await client.connect();
    const first = FakeWebSocket.instances[0];
    first.open();
    client.setControl("paint_pump", { velocity_ratio: 1 });
    await vi.advanceTimersByTimeAsync(CONTROL_SAMPLE_MS);
    first.close();
    await vi.advanceTimersByTimeAsync(2053);
    const second = FakeWebSocket.instances[1];
    second.open();
    await vi.advanceTimersByTimeAsync(CONTROL_SAMPLE_MS * 2);
    expect(second.sent.filter((frame) => frame.type === "control.update")).toHaveLength(0);
    client.disconnect();
  });

  it("neutralizes an active channel on explicit clear", async () => {
    const client = createClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    client.setControl("table_rotation", { velocity_ratio: 1 });
    client.clearControl("table_rotation");
    expect(socket.sent.at(-1)).toMatchObject({ channel: "table_rotation", payload: { velocity_ratio: 0 } });
    client.disconnect();
  });
});
