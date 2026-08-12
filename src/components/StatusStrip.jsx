/**
 * Descriptor: Compact Soul Ink Mobile readiness and exception summary.
 * Usage: App renders only statuses that require attention, or one ready badge.
 */

/** Select status exceptions without repeating healthy details. Usage: compact header rendering and tests. */
export function importantStatuses(state, copy) {
  const entries = [];
  if (state.connection !== "connected") entries.push({ label: `${copy.link}: ${state.connection}`, tone: "warn" });
  if (!new Set(["ok", "healthy", "ready"]).has(state.health)) {
    entries.push({ label: `${copy.health}: ${String(state.health)}`, tone: state.health === "unknown" ? "muted" : "warn" });
  }
  if (!state.lease.owned) entries.push({ label: `${copy.lease}: ${copy.readOnly}`, tone: "warn" });
  if (!state.session.active) entries.push({ label: `${copy.session}: ${state.session.status}`, tone: "muted" });
  if (state.recording.active) entries.push({ label: copy.recording, tone: "good" });
  return entries.length > 0 ? entries : [{ label: copy.ready, tone: "good" }];
}

/** Render only safety-relevant exceptions or one ready badge. Usage: App header. */
export default function StatusStrip({ state, copy }) {
  return (
    <div className="status-strip" aria-label={copy.label}>
      {importantStatuses(state, copy).map((entry) => (
        <span key={entry.label} className={`status ${entry.tone}`}>{entry.label}</span>
      ))}
    </div>
  );
}
