/**
 * Descriptor: Pure authoritative UI state transitions for PBM machine events.
 * Usage: React useReducer applies every SigmundClient event through pbmReducer.
 */

export const initialPbmState = Object.freeze({
  connection: "disconnected",
  health: "unknown",
  fault: { active: false, source: null, code: null, message: null },
  profile: null,
  machine: null,
  lease: { active: null, owned: false, mode: null },
  session: { active: false, id: null, status: "idle" },
  recording: { active: false, status: "idle" },
  replay: { busy: false, available: { gesture: false, motif: false, run: false } },
  operations: {},
  notice: "Opening Soul Ink Mobile never starts motion.",
});

/** Extract application workflow state from one machine snapshot. Usage: state event reducer. */
function applicationState(payload, previous) {
  const source = payload?.painting || payload?.application || {};
  return {
    session: { ...previous.session, ...(source.session || {}) },
    recording: { ...previous.recording, ...(source.recording || {}) },
    replay: {
      ...previous.replay,
      ...(source.replay || {}),
      available: { ...previous.replay.available, ...(source.replay?.available || {}) },
    },
  };
}

/** Extract the first actionable machine fault from authoritative health. Usage: state event reducer. */
function machineFault(health) {
  const devices = health?.devices || {};
  const entry = Object.entries(devices).find(([, device]) => device?.faulted);
  if (!entry) return { active: false, source: null, code: null, message: null };
  const [source, device] = entry;
  return {
    active: true,
    source,
    code: device.fault_code || "unspecified",
    message: device.fault_summary || device.last_error || `${source} reports a machine fault.`,
  };
}

/** Convert connection, lease, lifecycle, and state events into renderable truth. Usage: useReducer. */
export function pbmReducer(state, event) {
  switch (event.type) {
    case "client.status":
      return { ...state, connection: event.status };
    case "client.error":
      return { ...state, notice: event.error };
    case "client.safety_stop":
      return { ...state, notice: `Continuous controls stopped: ${event.reason}` };
    case "profile":
      return { ...state, profile: event.payload };
    case "state": {
      const workflow = applicationState(event.payload, state);
      const health = event.payload?.health;
      const healthStatus = typeof health === "object" && health !== null
        ? (health.faulted ? "faulted" : health.ok ? "healthy" : "degraded")
        : health || "unknown";
      return {
        ...state,
        machine: event.payload,
        health: healthStatus,
        fault: machineFault(health),
        ...workflow,
      };
    }
    case "lease": {
      const active = event.payload?.active ?? event.active ?? event.lease ?? null;
      return {
        ...state,
        lease: {
          active,
          owned: Boolean(active && active.holder === event.localHolder),
          mode: active?.mode || null,
        },
      };
    }
    case "fault": {
      const cleared = event.state === "cleared";
      const message = event.message || event.payload?.message || "Machine fault";
      return {
        ...state,
        fault: cleared ? { active: false, source: null, code: null, message: null } : {
          active: true,
          source: event.source || event.payload?.source || "machine",
          code: event.code || event.payload?.code || "unspecified",
          message,
        },
        notice: message,
      };
    }
    case "operation.requested":
      return {
        ...state,
        operations: { ...state.operations, [event.name]: { status: "requested", requestId: event.requestId || null } },
      };
    case "operation.accepted":
      if (["confirmed", "failed", "faulted"].includes(state.operations[event.name]?.status)) return state;
      return {
        ...state,
        operations: { ...state.operations, [event.name]: { status: "accepted", requestId: event.requestId || null } },
      };
    case "operation.failed":
      return {
        ...state,
        operations: { ...state.operations, [event.name]: { status: "failed", error: event.error } },
        notice: event.error,
      };
    case "command.lifecycle": {
      const commandId = event.command_id || event.payload?.command_id || null;
      const correlatedName = Object.entries(state.operations).find(([, operation]) => operation.requestId === commandId)?.[0];
      const operationName = correlatedName || event.operation || event.command || event.payload?.operation || event.payload?.command;
      const lifecycle = event.state || event.payload?.state;
      if (!operationName || !lifecycle) return state;
      const failed = ["failed", "faulted"].includes(lifecycle);
      return {
        ...state,
        operations: {
          ...state.operations,
          [operationName]: {
            status: lifecycle === "completed" ? "confirmed" : lifecycle,
            requestId: commandId,
            error: failed ? event.message || event.payload?.message || "Command failed" : null,
          },
        },
        notice: failed ? event.message || event.payload?.message || "Command failed" : state.notice,
      };
    }
    default:
      return state;
  }
}

/** Determine whether task controls may mutate the machine. Usage: App read-only guard. */
export function canOperate(state) {
  return state.connection === "connected" && state.lease.owned && state.session.active;
}

/** Produce concise requested/accepted/confirmed/failed text. Usage: task buttons. */
export function operationLabel(state, name, fallback) {
  const status = state.operations[name]?.status;
  return status ? `${fallback} · ${status}` : fallback;
}
