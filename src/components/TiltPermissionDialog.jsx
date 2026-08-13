/**
 * Descriptor: explicit phone-sensor setup dialog for Soul Ink Mobile tilt control.
 * Usage: App opens it before requesting browser motion permission and capturing neutral.
 */

/** Present phone-neutral setup or browser-specific blocked-sensor recovery. Usage: Initialize and Enable Tilting. */
export default function TiltPermissionDialog({ brave, busy, continueWithoutTilting, copy, mode, onCancel, onContinue }) {
  if (!mode) return null;
  const blocked = mode === "blocked";
  const title = blocked ? (brave ? copy.braveSensorsBlockedTitle : copy.phoneSensorsBlockedTitle) : copy.tiltDialogTitle;
  const body = blocked ? (brave ? copy.braveSensorsBlockedBody : copy.phoneSensorsBlockedBody) : copy.tiltDialogBody;
  const note = blocked ? copy.phoneSensorsBlockedNote : copy.tiltDialogNote;
  const cancelLabel = continueWithoutTilting ? copy.continueWithoutTilting : copy.cancel;
  const continueLabel = busy ? copy.testingSensors : blocked ? copy.testSensorsAgain : copy.continueAndSetNeutral;
  return (
    <div className="sensor-dialog-backdrop">
      <section
        className="sensor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tilt-dialog-title"
        aria-describedby="tilt-dialog-description tilt-dialog-note"
      >
        <h2 id="tilt-dialog-title">{title}</h2>
        <p id="tilt-dialog-description">{body}</p>
        {blocked && brave && (
          <ol className="sensor-dialog-steps">
            {copy.braveSensorSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        )}
        <p id="tilt-dialog-note" className="sensor-dialog-note">{note}</p>
        <div className="sensor-dialog-actions">
          <button type="button" className="control-button neutral" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="control-button accent" disabled={busy} onClick={onContinue} autoFocus>{continueLabel}</button>
        </div>
      </section>
    </div>
  );
}
