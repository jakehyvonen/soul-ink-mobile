/**
 * Descriptor: English and draft German labels for the Soul Ink Mobile control surface.
 * Usage: App selects a catalog from the localized Studio path; German requires owner review before publication.
 */

const xyDeliveryCopy = Object.freeze({
  confirmed: "motion confirmed", failed: "control rejected", idle: "ready", sending: "sending motion", stopping: "stopping",
});

const deliveryCopy = Object.freeze({
  confirmed: "confirmed", failed: "rejected", idle: "ready", sending: "sending", stopping: "stopping",
});

export const mobileCopy = Object.freeze({
  en: Object.freeze({
    beginPainting: "Begin Painting", clearStop: "Clear Stop", controlsLive: "controls live",
    controlDisconnected: "Control unavailable: the phone is disconnected from Sigmund.",
    controlFault: "Control paused: resolve the machine fault shown above, then initialize and begin again.",
    controlLive: "Control is live. Drag the XY joystick or hold a paint/table control.",
    controlNeedsLease: "Control is read-only. Select Initialize Sigmund or Begin Painting to request control.",
    controlNeedsSession: "Sigmund is initialized. Select Begin Painting to enable the movement controls.",
    initialize: "Initialize Sigmund",
    diagnostics: "Diagnostics", enablePhoneTilt: "Enable & Calibrate Phone", endPainting: "End Painting",
    holdCcw: "Hold CCW", holdCw: "Hold CW", holdDispense: "Hold Dispense", language: "Deutsch",
    level: "Level", localHardware: "LOCAL HARDWARE TEST: motion is enabled. Painting data is held in memory and will not be saved.",
    modeLocal: "local", modeRemote: "paired", paintTable: "Paint and table", paintingSession: "Painting session",
    readOnly: "read-only", recordMotif: "Record Motif", releaseStops: "release always stops", replay: "Replay",
    notCalibrated: "not calibrated", phoneTilt: "Phone tilt", phoneTiltUnavailable: "Phone motion access is unavailable or was not allowed.", recalibratePhone: "Recalibrate Phone",
    rotation: "Rotation", stopAll: "STOP ALL", stopMotif: "Stop Motif", stopPump: "Stop Pump", stopRotation: "Stop Rotation",
    status: Object.freeze({ health: "Health", label: "Sigmund status", lease: "Lease", link: "Link", readOnly: "read-only", ready: "Sigmund ready", recording: "Recording motif", session: "Session" }),
    stopTilt: "Stop & Level Tilt", syringesReplay: "Syringes and replay", tilt: "Tilt", tiltEnabled: "Phone calibrated",
    title: "Soul Ink Mobile", usePhoneTilt: "Use Phone Tilt", waitsConfirmation: "waits for confirmation", xyJoystick: "XY joystick",
    xyDelivery: xyDeliveryCopy,
    delivery: deliveryCopy,
  }),
  de: Object.freeze({
    beginPainting: "Malen beginnen", clearStop: "Stopp aufheben", controlsLive: "Steuerung aktiv",
    controlDisconnected: "Steuerung nicht verfügbar: Das Handy ist nicht mit Sigmund verbunden.",
    controlFault: "Steuerung pausiert: Den oben angezeigten Maschinenfehler beheben, dann erneut initialisieren und starten.",
    controlLive: "Steuerung ist aktiv. Den XY-Joystick ziehen oder eine Farb-/Tischsteuerung halten.",
    controlNeedsLease: "Steuerung ist schreibgeschützt. Sigmund initialisieren oder Malen beginnen wählen, um Steuerung anzufordern.",
    controlNeedsSession: "Sigmund ist initialisiert. Malen beginnen wählen, um Bewegungssteuerungen zu aktivieren.",
    initialize: "Sigmund initialisieren",
    diagnostics: "Diagnose", enablePhoneTilt: "Handy aktivieren und kalibrieren", endPainting: "Malen beenden",
    holdCcw: "Gegen Uhrzeigersinn halten", holdCw: "Im Uhrzeigersinn halten", holdDispense: "Farbe ausgeben", language: "English",
    level: "Ausrichten", localHardware: "LOKALER HARDWARETEST: Bewegung ist aktiviert. Maldaten werden nur im Speicher gehalten und nicht gespeichert.",
    modeLocal: "lokal", modeRemote: "gekoppelt", paintTable: "Farbe und Tisch", paintingSession: "Mal-Session",
    readOnly: "nur Anzeige", recordMotif: "Motiv aufnehmen", releaseStops: "Loslassen stoppt immer", replay: "Wiedergeben",
    notCalibrated: "nicht kalibriert", phoneTilt: "Handy-Neigung", phoneTiltUnavailable: "Der Zugriff auf die Bewegungssensoren ist nicht verfügbar oder wurde nicht erlaubt.", recalibratePhone: "Handy neu kalibrieren",
    rotation: "Drehung", stopAll: "ALLES STOPPEN", stopMotif: "Motiv stoppen", stopPump: "Pumpe stoppen", stopRotation: "Drehung stoppen",
    status: Object.freeze({ health: "Zustand", label: "Sigmund-Status", lease: "Steuerung", link: "Verbindung", readOnly: "nur Anzeige", ready: "Sigmund bereit", recording: "Motivaufnahme", session: "Session" }),
    stopTilt: "Neigung stoppen und ausrichten", syringesReplay: "Spritzen und Wiedergabe", tilt: "Neigung", tiltEnabled: "Handy kalibriert",
    title: "Soul Ink Mobile", usePhoneTilt: "Handy-Neigung verwenden", waitsConfirmation: "wartet auf Bestätigung", xyJoystick: "XY-Joystick",
    xyDelivery: xyDeliveryCopy,
    delivery: deliveryCopy,
  }),
});

/** Select the catalog from the stable English or German Studio route. */
export function mobileLocale(pathname = globalThis.location?.pathname || "/mobile/") {
  return pathname.startsWith("/de/") ? "de" : "en";
}
