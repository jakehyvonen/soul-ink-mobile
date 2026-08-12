/**
 * Descriptor: English and draft German labels for the Soul Ink Mobile control surface.
 * Usage: App selects a catalog from the localized Studio path; German requires owner review before publication.
 */

export const mobileCopy = Object.freeze({
  en: Object.freeze({
    beginPainting: "Begin Painting", clearStop: "Clear Stop", controlsLive: "controls live",
    controlDisconnected: "Control unavailable: the phone is disconnected from Sigmund.",
    controlFault: "Control paused: resolve the machine fault shown above, then initialize and begin again.",
    controlLive: "Control is live. Drag the XY joystick or hold a paint/table control.",
    controlNeedsLease: "Control is read-only. Select Initialize Sigmund or Begin Painting to request control.",
    controlNeedsSession: "Sigmund is initialized. Select Begin Painting to enable the movement controls.",
    initialize: "Initialize Sigmund",
    diagnostics: "Diagnostics", enablePhoneTilt: "Enable Phone Tilt", endPainting: "End Painting",
    holdCcw: "Hold CCW", holdCw: "Hold CW", holdDispense: "Hold Dispense", language: "Deutsch",
    level: "Level", localHardware: "LOCAL HARDWARE TEST: motion is enabled. Painting data is held in memory and will not be saved.",
    modeLocal: "local", modeRemote: "paired", paintTable: "Paint and table", paintingSession: "Painting session",
    readOnly: "read-only", recordMotif: "Record Motif", releaseStops: "release always stops", replay: "Replay",
    stopAll: "STOP ALL", stopMotif: "Stop Motif", stopPump: "Stop Pump", stopRotation: "Stop Rotation",
    stopTilt: "Stop Tilt", syringesReplay: "Syringes and replay", tiltEnabled: "Tilt Enabled",
    title: "Soul Ink Mobile", usePhoneTilt: "Use Phone Tilt", waitsConfirmation: "waits for confirmation", xyJoystick: "XY joystick",
  }),
  de: Object.freeze({
    beginPainting: "Malen beginnen", clearStop: "Stopp aufheben", controlsLive: "Steuerung aktiv",
    controlDisconnected: "Steuerung nicht verfügbar: Das Handy ist nicht mit Sigmund verbunden.",
    controlFault: "Steuerung pausiert: Den oben angezeigten Maschinenfehler beheben, dann erneut initialisieren und starten.",
    controlLive: "Steuerung ist aktiv. Den XY-Joystick ziehen oder eine Farb-/Tischsteuerung halten.",
    controlNeedsLease: "Steuerung ist schreibgeschützt. Sigmund initialisieren oder Malen beginnen wählen, um Steuerung anzufordern.",
    controlNeedsSession: "Sigmund ist initialisiert. Malen beginnen wählen, um Bewegungssteuerungen zu aktivieren.",
    initialize: "Sigmund initialisieren",
    diagnostics: "Diagnose", enablePhoneTilt: "Handy-Neigung aktivieren", endPainting: "Malen beenden",
    holdCcw: "Gegen Uhrzeigersinn halten", holdCw: "Im Uhrzeigersinn halten", holdDispense: "Farbe ausgeben", language: "English",
    level: "Ausrichten", localHardware: "LOKALER HARDWARETEST: Bewegung ist aktiviert. Maldaten werden nur im Speicher gehalten und nicht gespeichert.",
    modeLocal: "lokal", modeRemote: "gekoppelt", paintTable: "Farbe und Tisch", paintingSession: "Mal-Session",
    readOnly: "nur Anzeige", recordMotif: "Motiv aufnehmen", releaseStops: "Loslassen stoppt immer", replay: "Wiedergeben",
    stopAll: "ALLES STOPPEN", stopMotif: "Motiv stoppen", stopPump: "Pumpe stoppen", stopRotation: "Drehung stoppen",
    stopTilt: "Neigung stoppen", syringesReplay: "Spritzen und Wiedergabe", tiltEnabled: "Neigung aktiviert",
    title: "Soul Ink Mobile", usePhoneTilt: "Handy-Neigung verwenden", waitsConfirmation: "wartet auf Bestätigung", xyJoystick: "XY-Joystick",
  }),
});

/** Select the catalog from the stable English or German Studio route. */
export function mobileLocale(pathname = globalThis.location?.pathname || "/mobile/") {
  return pathname.startsWith("/de/") ? "de" : "en";
}
