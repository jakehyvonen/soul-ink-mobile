/**
 * Descriptor: portrait safety gate shown while an active painting session requires landscape controls.
 * Usage: App renders this beside the control surface so CSS can reveal it only in portrait orientation.
 */

/** Render rotation guidance while retaining Stop All and End Painting access. Usage: active portrait painting sessions. */
export default function LandscapeRequiredScreen({ connected, copy, onEndPainting, onStopAll }) {
  return (
    <aside className="landscape-required-screen" role="dialog" aria-modal="true" aria-labelledby="landscape-required-title">
      <div className="landscape-required-card">
        <span className="landscape-required-icon" aria-hidden="true">↻</span>
        <h2 id="landscape-required-title">{copy.landscapeRequiredTitle}</h2>
        <p>{copy.landscapeRequiredBody}</p>
        <div className="landscape-required-actions">
          <button type="button" className="stop-all" disabled={!connected} onClick={onStopAll}>{copy.stopAll}</button>
          <button type="button" className="task-button warn" onClick={onEndPainting}>{copy.endPainting}</button>
        </div>
      </div>
    </aside>
  );
}
