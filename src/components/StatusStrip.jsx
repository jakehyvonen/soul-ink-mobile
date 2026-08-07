/**
 * Descriptor: Persistent PBM connection, health, lease, session, and recording summary.
 * Usage: App renders it above every workflow so degraded states stay visible.
 */

/** Map a state word to a semantic status tone. Usage: status badge rendering. */
function toneFor(value, goodValues) {
  return goodValues.includes(value) ? "good" : value === "unknown" || value === "idle" ? "muted" : "warn";
}

/** Render all safety-relevant status in one compact strip. Usage: App header. */
export default function StatusStrip({ state }) {
  const leaseText = state.lease.owned ? state.lease.mode || "operator" : "read-only";
  return (
    <div className="status-strip" aria-label="Sigmund status">
      <span className={`status ${toneFor(state.connection, ["connected"])}`}>Link: {state.connection}</span>
      <span className={`status ${toneFor(state.health, ["ok", "healthy", "ready"])}`}>Health: {String(state.health)}</span>
      <span className={`status ${toneFor(leaseText, ["operator"])}`}>Lease: {leaseText}</span>
      <span className={`status ${toneFor(state.session.active ? "active" : "idle", ["active"])}`}>
        Session: {state.session.active ? "active" : state.session.status}
      </span>
      <span className={`status ${toneFor(state.recording.active ? "recording" : "idle", ["recording"])}`}>
        Motif: {state.recording.active ? "recording" : state.recording.status}
      </span>
    </div>
  );
}
