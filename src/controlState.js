/**
 * Descriptor: Pure authoritative UI state transitions for PBM machine events.
 * Usage: React useReducer applies every SigmundClient event through pbmReducer.
 */

export const initialPbmState = Object.freeze({
  connection: "disconnected",
  health: "unknown",
  profile: null,
  machine: null,
  lease: { active: null, owned: false, mode: null },
  session: { active: false, id: null, status: "idle" },
  recording: { active: false, status: "idle" },
  replay: { busy: false, available: { gesture: false, motif: false, run: false } },
  operations: {},
  notice: "Opening PBM never starts motion.",
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
      return {
        ...state,
        machine: event.payload,
        health: event.payload?.health?.overall || event.payload?.health || "unknown",
        ...workflow,
      };
    }
    case "lease": {
      const active = event.payload?.active ?? event.active ?? null;
      return {
        ...state,
        lease: {
          active,
          owned: Boolean(active && active.holder === event.localHolder),
          mode: active?.mode || null,
        },
      };
    }
    case "fault":
      return { ...state, notice: event.message || event.payload?.message || "Machine fault" };
    case "operation.requested":
      return {
        ...state,
        operations: { ...state.operations, [event.name]: { status: "requested", requestId: event.requestId || null } },
      };
    case "operation.accepted":
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
      const operationName = event.operation || event.command || event.payload?.operation || event.payload?.command;
      const lifecycle = event.state || event.payload?.state;
      if (!operationName || !lifecycle) return state;
      return {
        ...state,
        operations: {
          ...state.operations,
          [operationName]: {
            status: lifecycle === "completed" ? "confirmed" : lifecycle,
            requestId: event.command_id || event.payload?.command_id || null,
          },
        },
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
