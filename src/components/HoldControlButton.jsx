/**
 * Descriptor: Accessible press-and-hold control that always emits a matching stop.
 * Usage: pump and rotary controls provide start and stop callbacks.
 */

/** Render pointer/keyboard hold semantics with cancel and lost-capture safety. Usage: PBM controls. */
export default function HoldControlButton({ children, onStart, onStop, disabled = false, tone = "accent" }) {
  /** Start only after pointer capture succeeds. Usage: pointer down. */
  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onStart();
  }

  /** Stop and release pointer capture. Usage: release, cancel, or capture loss. */
  function handlePointerStop(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onStop();
  }

  /** Start from Space or Enter. Usage: keyboard press. */
  function handleKeyDown(event) {
    if (!event.repeat && (event.key === " " || event.key === "Enter")) onStart();
  }

  /** Stop from Space or Enter. Usage: keyboard release. */
  function handleKeyUp(event) {
    if (event.key === " " || event.key === "Enter") onStop();
  }

  return (
    <button
      type="button"
      className={`control-button ${tone}`}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerStop}
      onPointerCancel={handlePointerStop}
      onLostPointerCapture={onStop}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {children}
    </button>
  );
}
