/**
 * Descriptor: explicit phone-sensor setup dialog for Soul Ink Mobile tilt control.
 * Usage: App opens it before requesting browser motion permission and capturing neutral.
 */

/** Present the phone-neutral instructions and a user-gesture permission action. Usage: Enable Tilting. */
export default function TiltPermissionDialog({ copy, open, onCancel, onContinue }) {
  if (!open) return null;
  return (
    <div className="sensor-dialog-backdrop">
      <section
        className="sensor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tilt-dialog-title"
        aria-describedby="tilt-dialog-description tilt-dialog-note"
      >
        <h2 id="tilt-dialog-title">{copy.tiltDialogTitle}</h2>
        <p id="tilt-dialog-description">{copy.tiltDialogBody}</p>
        <p id="tilt-dialog-note" className="sensor-dialog-note">{copy.tiltDialogNote}</p>
        <div className="sensor-dialog-actions">
          <button type="button" className="control-button neutral" onClick={onCancel}>{copy.cancel}</button>
          <button type="button" className="control-button accent" onClick={onContinue} autoFocus>{copy.continueAndSetNeutral}</button>
        </div>
      </section>
    </div>
  );
}
