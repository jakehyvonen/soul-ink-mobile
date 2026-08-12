/**
 * Descriptor: Reducer tests proving PBM renders authoritative workflow state.
 * Usage: `npm test` guards lease ownership and non-optimistic task state.
 */
import { describe, expect, it } from "vitest";
import { canOperate, initialPbmState, pbmReducer } from "./controlState.js";

describe("PBM authoritative control state", () => {
  it("stays read-only merely because a socket connected", () => {
    const connected = pbmReducer(initialPbmState, { type: "client.status", status: "connected" });
    expect(canOperate(connected)).toBe(false);
  });

  it("requires owned lease and confirmed active session", () => {
    let state = pbmReducer(initialPbmState, { type: "client.status", status: "connected" });
    state = pbmReducer(state, { type: "lease", localHolder: "pbm-107", payload: { active: { holder: "pbm-107", mode: "operator" } } });
    expect(canOperate(state)).toBe(false);
    state = pbmReducer(state, { type: "state", payload: { health: "ok", painting: { session: { active: true, status: "active" } } } });
    expect(canOperate(state)).toBe(true);
  });

  it("enables controls from the Pi-confirmed painting start result", () => {
    let state = pbmReducer(initialPbmState, { type: "client.status", status: "connected" });
    state = pbmReducer(state, {
      type: "lease",
      owned_by_client: true,
      payload: { lease: { holder: "remote:session-131:user-137", mode: "operator" } },
    });
    state = pbmReducer(state, {
      type: "painting.state",
      payload: { session: { active: true, id: "painting-139", status: "active" } },
    });

    expect(canOperate(state)).toBe(true);
    expect(state.session).toMatchObject({ active: true, id: "painting-139" });
  });

  it("recognizes the gateway's nested remote lease payload", () => {
    const state = pbmReducer(initialPbmState, {
      type: "lease",
      localHolder: "mobile-127",
      payload: { lease: { holder: "mobile-127", mode: "operator" } },
    });

    expect(state.lease).toEqual({
      active: { holder: "mobile-127", mode: "operator" },
      owned: true,
      mode: "operator",
    });
  });

  it("uses transport-confirmed ownership for a gateway-derived holder", () => {
    const state = pbmReducer(initialPbmState, {
      type: "lease",
      localHolder: "mobile-127",
      owned_by_client: true,
      payload: { lease: { holder: "remote:session-131:user-137", mode: "operator" } },
    });
    expect(state.lease.owned).toBe(true);
  });

  it("does not treat an accepted syringe request as confirmed", () => {
    let state = pbmReducer(initialPbmState, { type: "operation.requested", name: "syringe_2", requestId: "pbm-113" });
    state = pbmReducer(state, { type: "operation.accepted", name: "syringe_2", requestId: "pbm-113" });
    expect(state.operations.syringe_2.status).toBe("accepted");
    state = pbmReducer(state, { type: "command.lifecycle", command: "SwapSyringe", command_id: "pbm-113", state: "completed" });
    expect(state.operations.syringe_2.status).toBe("confirmed");
  });

  it("shows the controller fault summary and lifecycle failure message", () => {
    let state = pbmReducer(initialPbmState, {
      type: "state",
      payload: {
        health: {
          ok: true,
          faulted: true,
          devices: { pico: { faulted: true, fault_code: "estop", fault_summary: "Verify safety, then clear stop." } },
        },
      },
    });
    expect(state.health).toBe("faulted");
    expect(state.fault).toMatchObject({ active: true, source: "pico", code: "estop" });
    state = pbmReducer(state, {
      type: "command.lifecycle",
      command: "PaintingSessionStart",
      command_id: "pbm-127",
      state: "faulted",
      message: "Painting persistence is not configured",
    });
    expect(state.notice).toBe("Painting persistence is not configured");
  });

  it("clears a transient rejection after the Pi confirms control delivery", () => {
    let state = pbmReducer(initialPbmState, { type: "client.error", error: "message is stale or sent in the future" });

    state = pbmReducer(state, { type: "client.control_delivery", channel: "xy_joystick", state: "confirmed" });

    expect(state.notice).toBe(initialPbmState.notice);
  });
});
