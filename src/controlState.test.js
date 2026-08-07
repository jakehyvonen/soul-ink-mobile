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

  it("does not treat an accepted syringe request as confirmed", () => {
    let state = pbmReducer(initialPbmState, { type: "operation.requested", name: "syringe_2", requestId: "pbm-113" });
    state = pbmReducer(state, { type: "operation.accepted", name: "syringe_2", requestId: "pbm-113" });
    expect(state.operations.syringe_2.status).toBe("accepted");
    state = pbmReducer(state, { type: "command.lifecycle", command: "SwapSyringe", command_id: "pbm-113", state: "completed" });
    expect(state.operations.syringe_2.status).toBe("confirmed");
  });
});
