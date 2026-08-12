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

/** Construct a paired remote client with one deterministic admission. */
function createPairedClient() {
  const admission = {
    ticket: `${"a".repeat(53)}.${"b".repeat(53)}`,
    websocketUrl: "wss://control.soul-ink.art/v1/machines/sigmund/socket",
  };
  return new SigmundClient(validateRuntimeConfig({ auth: "pairing", machineId: "sigmund", mode: "remote" }), {
    admissionProvider: async () => admission,
    WebSocketImpl: FakeWebSocket,
    holder: "mobile-127",
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

  it("authenticates a paired controller before reporting connected", async () => {
    const client = createPairedClient();
    const events = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    expect(socket.url).toBe("wss://control.soul-ink.art/v1/machines/sigmund/socket");
    socket.open();
    expect(socket.sent[0]).toMatchObject({ type: "participant.authenticate" });
    expect(events).not.toContainEqual({ type: "client.status", status: "connected" });
    socket.receive({ type: "authentication.accepted", role: "controller" });
    expect(events).toContainEqual({ type: "client.status", status: "connected" });
    client.disconnect();
  });

  it("heartbeats a gateway-nested remote operator lease", async () => {
    const client = createPairedClient();
    const events = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "authentication.accepted", role: "controller" });
    const acquisition = client.sendRequest("lease.acquire", { mode: "operator" });
    const request = socket.sent.at(-1);
    socket.receive({
      correlation_id: request.request_id,
      payload: {
        kind: "lease.acquire",
        ok: true,
        result: { lease: { holder: "remote:session-127:user-131", mode: "operator" }, ok: true },
      },
      state: "accepted",
      type: "command.lifecycle",
    });
    await acquisition;

    socket.receive({
      payload: { action: "heartbeat", lease: { holder: "remote:session-127:user-131", mode: "operator" } },
      type: "lease",
    });
    expect(events.at(-1)).toMatchObject({ type: "lease", owned_by_client: true });

    await vi.advanceTimersByTimeAsync(2053);

    const heartbeat = socket.sent.find((frame) => frame.type === "lease.heartbeat");
    expect(heartbeat).toBeDefined();
    socket.receive({
      correlation_id: heartbeat.request_id,
      payload: {
        kind: "lease.heartbeat",
        ok: true,
        result: { lease: { holder: "remote:session-127:user-131", mode: "operator" }, ok: true },
      },
      state: "accepted",
      type: "command.lifecycle",
    });
    await vi.advanceTimersByTimeAsync(2053);
    expect(socket.sent.filter((frame) => frame.type === "lease.heartbeat")).toHaveLength(2);
    client.disconnect();
  });

  it("publishes Pi-confirmed painting state immediately from a discrete reply", async () => {
    const client = createPairedClient();
    const events = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "authentication.accepted", role: "controller" });
    const pending = client.sendRequest("painting_session_start");
    const request = socket.sent.at(-1);
    const painting = { session: { active: true, id: "painting-137", status: "active" } };
    socket.receive({
      correlation_id: request.request_id,
      payload: { kind: "painting_session_start", ok: true, result: { ok: true, painting } },
      state: "accepted",
      type: "command.lifecycle",
    });

    await pending;
    expect(events).toContainEqual({ type: "painting.state", payload: painting });
    client.disconnect();
  });

  it("rejects a correlated gateway error without waiting for timeout", async () => {
    const client = createPairedClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "authentication.accepted", role: "controller" });
    const pending = client.sendRequest("machine.initialize");
    const request = socket.sent.at(-1);

    socket.receive({
      correlation_id: request.request_id,
      error: "viewing device is not present",
      type: "gateway.error",
    });

    await expect(pending).rejects.toThrow("viewing device is not present");
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

  it("requests a deliberate local operator handoff only in local mode", async () => {
    const client = createClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    const pending = client.sendRequest("lease.acquire", { mode: "operator", local_handoff: true });
    const request = socket.sent.at(-1);

    expect(request).toMatchObject({
      type: "lease.acquire",
      mode: "operator",
      local_handoff: true,
    });
    socket.receive({ type: "request.result", request_id: request.request_id, payload: { ok: true } });
    await pending;
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
    client.clearControl("table_rotation");
    const stops = socket.sent.filter((frame) => frame.channel === "table_rotation");
    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({ channel: "table_rotation", payload: { velocity_ratio: 0 } });
    client.disconnect();
  });

  it("always sends an operator-requested explicit stop", async () => {
    const client = createClient();
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();

    client.stopControl("paint_pump");

    expect(socket.sent.at(-1)).toMatchObject({ channel: "paint_pump", payload: { velocity_ratio: 0 } });
    client.disconnect();
  });

  it("does not announce lease loss before it ever owned the lease", async () => {
    const client = createClient();
    const events = [];
    client.subscribe((event) => events.push(event));
    await client.connect();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.receive({ type: "lease", payload: { active: null } });
    expect(events.filter((event) => event.type === "client.safety_stop")).toHaveLength(0);
    client.disconnect();
  });
});
