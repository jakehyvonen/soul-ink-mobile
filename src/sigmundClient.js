/**
 * Descriptor: Native WebSocket client with correlated requests and latest-value controls.
 * Usage: create one client per PBM browser session and subscribe to authoritative events.
 */
import { resolveControlUrl } from "./runtimeConfig.js";

export const CONTROL_SAMPLE_MS = 53;
export const REQUEST_EXPIRY_MS = 5003;
export const RECONNECT_DELAY_MS = 2053;

const ZERO_VALUES = Object.freeze({
  xy_joystick: { x_ratio: 0, y_ratio: 0 },
  table_tilt: { u_ratio: 0, v_ratio: 0 },
  paint_pump: { velocity_ratio: 0 },
  table_rotation: { velocity_ratio: 0 },
});

/** Create a stable browser holder identifier. Usage: add to local WebSocket query string. */
function createHolderId() {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return `pbm-${suffix}`;
}

/** Clamp normalized browser values before they leave the UI. Usage: control payload normalization. */
function clampRatio(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(-1, Math.min(1, number));
}

/** Normalize one documented continuous channel. Usage: setControl and safety stops. */
export function normalizeControl(channel, values) {
  if (!(channel in ZERO_VALUES)) throw new Error(`unsupported control channel ${channel}`);
  if (channel === "xy_joystick") {
    return { x_ratio: clampRatio(values.x_ratio), y_ratio: clampRatio(values.y_ratio) };
  }
  if (channel === "table_tilt") {
    return { u_ratio: clampRatio(values.u_ratio), v_ratio: clampRatio(values.v_ratio) };
  }
  return { velocity_ratio: clampRatio(values.velocity_ratio) };
}

/**
 * Own one safe PBM transport session and its continuous-control sampling.
 * Usage: App calls connect, sendRequest, setControl, stopContinuous, then disconnect.
 */
export class SigmundClient {
  constructor(config, options = {}) {
    this.config = config;
    this.WebSocketImpl = options.WebSocketImpl || globalThis.WebSocket;
    this.tokenProvider = options.tokenProvider || (async () => "");
    this.holder = options.holder || createHolderId();
    this.socket = null;
    this.listeners = new Set();
    this.pending = new Map();
    this.values = new Map();
    this.sequences = new Map();
    this.requestSequence = 0;
    this.sampleTimer = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.closedByUser = false;
    this.status = "disconnected";
  }

  /** Subscribe to connection and machine events. Usage: React state hook; returns unsubscribe. */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Publish one client event to subscribers. Usage: internal transport lifecycle handling. */
  emit(event) {
    this.listeners.forEach((listener) => listener(event));
  }

  /** Open the configured WebSocket without acquiring a local lease. Usage: application bootstrap. */
  async connect() {
    if (this.socket && this.socket.readyState <= 1) return;
    this.closedByUser = false;
    this.setStatus("connecting");
    const baseUrl = resolveControlUrl(this.config);
    const url = new URL(baseUrl);
    if (this.config.mode === "local") {
      url.searchParams.set("holder", this.holder);
      url.searchParams.set("auto_lease", "false");
    }
    this.socket = new this.WebSocketImpl(url.toString());
    this.socket.addEventListener("open", () => this.handleOpen());
    this.socket.addEventListener("message", (event) => this.handleMessage(event));
    this.socket.addEventListener("close", () => this.handleClose());
    this.socket.addEventListener("error", () => this.emit({ type: "client.error", error: "WebSocket error" }));
  }

  /** Authenticate remote sockets in the first frame and start sampling. Usage: WebSocket open event. */
  async handleOpen() {
    if (this.config.auth === "supabase") {
      const token = await this.tokenProvider();
      if (!token) {
        this.socket?.close(4001, "authentication required");
        return;
      }
      this.sendFrame({ type: "auth", machine_id: this.config.machineId, access_token: token });
    }
    this.setStatus("connected");
    this.startSampler();
  }

  /** Route correlated results and authoritative events. Usage: WebSocket message event. */
  handleMessage(event) {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      this.emit({ type: "client.error", error: "Invalid server message" });
      return;
    }
    if (message.type === "request.result" && this.pending.has(message.request_id)) {
      const pending = this.pending.get(message.request_id);
      clearTimeout(pending.timeout);
      this.pending.delete(message.request_id);
      if (message.payload?.ok) pending.resolve(message.payload);
      else pending.reject(new Error(message.payload?.error || message.payload?.reason || "Request rejected"));
    }
    if (message.type === "lease") this.updateHeartbeat(message.payload?.active ?? message.active ?? null);
    this.emit(message);
  }

  /** Clear motion intent and schedule a fresh connection. Usage: WebSocket close event. */
  handleClose() {
    this.socket = null;
    this.stopSampler();
    this.stopHeartbeat();
    this.values.clear();
    this.rejectPending("Connection closed");
    this.setStatus("disconnected");
    this.emit({ type: "client.safety_stop", reason: "socket loss" });
    if (!this.closedByUser) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
    }
  }

  /** Close intentionally after clearing continuous outputs. Usage: React cleanup. */
  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.reconnectTimer);
    this.stopContinuous("client disconnect");
    this.stopSampler();
    this.stopHeartbeat();
    this.socket?.close(1000, "client disconnect");
    this.socket = null;
  }

  /** Send one correlated discrete request with a finite deadline. Usage: lease, session, and task actions. */
  sendRequest(type, fields = {}, timeoutMs = REQUEST_EXPIRY_MS) {
    const requestId = `${this.holder}-${++this.requestSequence}`;
    return new Promise((resolve, reject) => {
      if (!this.isOpen()) {
        reject(new Error("Sigmund is disconnected"));
        return;
      }
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`${type} timed out`));
      }, timeoutMs);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.sendFrame({ type, request_id: requestId, machine_id: this.config.machineId, ...fields });
    });
  }

  /** Store the latest normalized control value for 53 ms sampling. Usage: joystick, tilt, pump, rotation. */
  setControl(channel, values) {
    this.values.set(channel, normalizeControl(channel, values));
  }

  /** Send neutral once and stop sampling one channel. Usage: pointer release or explicit stop. */
  clearControl(channel) {
    if (!(channel in ZERO_VALUES)) return;
    this.sendControlFrame(channel, ZERO_VALUES[channel]);
    this.values.delete(channel);
  }

  /** Neutralize every continuous output without acquiring or resuming a lease. Usage: every safety exit. */
  stopContinuous(reason = "safety exit") {
    for (const channel of Object.keys(ZERO_VALUES)) {
      if (this.values.has(channel)) this.sendControlFrame(channel, ZERO_VALUES[channel]);
    }
    this.values.clear();
    this.emit({ type: "client.safety_stop", reason });
  }

  /** Send Stop All through the server's sole arbiter. Usage: always-visible emergency UI. */
  async stopAll() {
    this.stopContinuous("Stop All");
    return this.sendRequest("stop.all");
  }

  /** Begin the 53 ms latest-value sampler. Usage: after socket authentication/open. */
  startSampler() {
    if (!this.sampleTimer) {
      this.sampleTimer = setInterval(() => {
        this.values.forEach((values, channel) => this.sendControlFrame(channel, values));
      }, CONTROL_SAMPLE_MS);
    }
  }

  /** End the sampler. Usage: disconnect and socket loss. */
  stopSampler() {
    clearInterval(this.sampleTimer);
    this.sampleTimer = null;
  }

  /** Renew only a currently owned lease and stop on ownership loss. Usage: lease event handling. */
  updateHeartbeat(activeLease) {
    const ownsLease = activeLease?.holder === this.holder;
    if (!ownsLease) {
      this.stopHeartbeat();
      this.stopContinuous("lease loss");
      return;
    }
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.sendRequest("lease.heartbeat").catch(() => this.stopContinuous("lease heartbeat failed"));
      }, RECONNECT_DELAY_MS);
    }
  }

  /** Stop automatic lease renewal. Usage: lease loss, socket loss, and disconnect. */
  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  /** Send one sequenced transient frame; no Promise is retained. Usage: sampler and neutral stops. */
  sendControlFrame(channel, values) {
    if (!this.isOpen()) return;
    const sequence = (this.sequences.get(channel) || 0) + 1;
    this.sequences.set(channel, sequence);
    this.sendFrame({
      type: "control.update",
      request_id: `${this.holder}-${channel}-${sequence}`,
      machine_id: this.config.machineId,
      channel,
      sequence,
      payload: values,
    });
  }

  /** Serialize one WebSocket frame. Usage: all outbound traffic after readiness checks. */
  sendFrame(message) {
    if (this.isOpen()) this.socket.send(JSON.stringify(message));
  }

  /** Report whether the socket can send. Usage: request and control guards. */
  isOpen() {
    return this.socket?.readyState === 1;
  }

  /** Publish a connection transition only when it changes. Usage: transport lifecycle. */
  setStatus(status) {
    if (status === this.status) return;
    this.status = status;
    this.emit({ type: "client.status", status });
  }

  /** Reject every waiting request. Usage: socket close and deliberate teardown. */
  rejectPending(reason) {
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error(reason));
    });
    this.pending.clear();
  }
}
