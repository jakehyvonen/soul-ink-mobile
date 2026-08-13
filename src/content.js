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
    beginPainting: "Begin Painting", braveSensorsBlockedBody: "Brave Android does not show a native permission popup for motion sensors. It silently returns empty readings until its separate Motion sensors setting is enabled.",
    braveSensorsBlockedTitle: "Brave is blocking motion sensors", cancel: "Cancel", clearStop: "Clear Stop", continueAndSetNeutral: "Continue & Set Neutral", continueWithoutTilting: "Initialize Without Tilting", controlsLive: "controls live",
    braveSensorSteps: Object.freeze(["Open Brave's ⋮ menu, then Settings.", "Open Site settings, then Motion sensors.", "Turn on Sites can use motion sensors, return here, and select Test Sensors Again."]),
    controlDisconnected: "Control unavailable: the phone is disconnected from Sigmund.",
    controlFault: "Control paused: resolve the machine fault shown above, then initialize and begin again.",
    controlLive: "Control is live. Drag the XY joystick or hold a paint/table control.",
    controlNeedsLease: "Control is read-only. Select Initialize Sigmund or Begin Painting to request control.",
    controlNeedsSession: "Sigmund is initialized. Select Begin Painting to enable the movement controls.",
    initialize: "Initialize Sigmund",
    diagnostics: "Diagnostics", disableTilting: "Disable Tilting", enableTilting: "Enable Tilting", endPainting: "End Painting",
    holdCcw: "Hold CCW", holdCw: "Hold CW", holdDispense: "Hold Dispense", language: "Deutsch",
    level: "Level", localHardware: "LOCAL HARDWARE TEST: motion is enabled. Painting data is held in memory and will not be saved.",
    modeLocal: "local", modeRemote: "paired", paintTable: "Paint and table", paintingSession: "Painting session",
    readOnly: "read-only", recordMotif: "Record Motif", releaseStops: "release always stops", replay: "Replay",
    phoneSensorTimeout: "No usable phone motion readings arrived.", phoneSensorsBlockedBody: "The browser exposed motion APIs but did not provide usable readings. Allow motion sensors for this site or try current Chrome on the same phone.",
    phoneSensorsBlockedNote: "Brave Shields and site whitelisting are separate from Brave's Motion sensors setting.", phoneSensorsBlockedTitle: "Phone motion sensors are blocked",
    phoneTilt: "Phone tilt", phoneTiltBlocked: "browser sensor blocked", phoneTiltOff: "off", phoneTiltUnavailable: "Phone motion access is unavailable or was not allowed.", phoneTiltWaiting: "waiting for phone sensor",
    rotation: "Rotation", stopAll: "STOP ALL", stopMotif: "Stop Motif", stopPump: "Stop Pump", stopRotation: "Stop Rotation",
    status: Object.freeze({ health: "Health", label: "Sigmund status", lease: "Lease", link: "Link", readOnly: "read-only", ready: "Sigmund ready", recording: "Recording motif", session: "Session" }),
    syringesReplay: "Syringes and replay", tilt: "Tilt", tiltEnabled: "Phone calibrated",
    tiltDialogBody: "Hold your phone at the angle you want to use as level. Continuing requests motion access if your browser requires it, then uses the phone's current position as neutral.",
    tiltDialogNote: "Tilting remains active only until you select Disable Tilting, Level, End Painting, or Stop All.", tiltDialogTitle: "Enable phone tilting?",
    testingSensors: "Testing Sensors…", testSensorsAgain: "Test Sensors Again", title: "Soul Ink Mobile", waitsConfirmation: "waits for confirmation", xyJoystick: "XY joystick",
    sensorCheckAvailable: "Success: this browser is delivering live phone-motion readings.", sensorCheckBody: "This page tests the browser and phone only. It does not pair with or send commands to Sigmund.", sensorCheckTitle: "Phone Sensor Check", testPhoneSensors: "Test Phone Sensors",
    xyDelivery: xyDeliveryCopy,
    delivery: deliveryCopy,
  }),
  de: Object.freeze({
    beginPainting: "Malen beginnen", braveSensorsBlockedBody: "Brave Android zeigt für Bewegungssensoren kein eigenes Berechtigungsfenster. Der Browser liefert leere Messwerte, bis die separate Einstellung Bewegungssensoren aktiviert ist.",
    braveSensorsBlockedTitle: "Brave blockiert Bewegungssensoren", cancel: "Abbrechen", clearStop: "Stopp aufheben", continueAndSetNeutral: "Weiter und Neutralpunkt setzen", continueWithoutTilting: "Ohne Neigung initialisieren", controlsLive: "Steuerung aktiv",
    braveSensorSteps: Object.freeze(["Das ⋮-Menü von Brave und dann Einstellungen öffnen.", "Website-Einstellungen und dann Bewegungssensoren öffnen.", "Websites dürfen Bewegungssensoren verwenden aktivieren, zurückkehren und Sensoren erneut testen wählen."]),
    controlDisconnected: "Steuerung nicht verfügbar: Das Handy ist nicht mit Sigmund verbunden.",
    controlFault: "Steuerung pausiert: Den oben angezeigten Maschinenfehler beheben, dann erneut initialisieren und starten.",
    controlLive: "Steuerung ist aktiv. Den XY-Joystick ziehen oder eine Farb-/Tischsteuerung halten.",
    controlNeedsLease: "Steuerung ist schreibgeschützt. Sigmund initialisieren oder Malen beginnen wählen, um Steuerung anzufordern.",
    controlNeedsSession: "Sigmund ist initialisiert. Malen beginnen wählen, um Bewegungssteuerungen zu aktivieren.",
    initialize: "Sigmund initialisieren",
    diagnostics: "Diagnose", disableTilting: "Neigung deaktivieren", enableTilting: "Neigung aktivieren", endPainting: "Malen beenden",
    holdCcw: "Gegen Uhrzeigersinn halten", holdCw: "Im Uhrzeigersinn halten", holdDispense: "Farbe ausgeben", language: "English",
    level: "Ausrichten", localHardware: "LOKALER HARDWARETEST: Bewegung ist aktiviert. Maldaten werden nur im Speicher gehalten und nicht gespeichert.",
    modeLocal: "lokal", modeRemote: "gekoppelt", paintTable: "Farbe und Tisch", paintingSession: "Mal-Session",
    readOnly: "nur Anzeige", recordMotif: "Motiv aufnehmen", releaseStops: "Loslassen stoppt immer", replay: "Wiedergeben",
    phoneSensorTimeout: "Es wurden keine verwendbaren Bewegungssensordaten empfangen.", phoneSensorsBlockedBody: "Der Browser stellt Bewegungsschnittstellen bereit, liefert aber keine verwendbaren Messwerte. Bewegungssensoren für diese Website erlauben oder aktuelles Chrome auf demselben Handy testen.",
    phoneSensorsBlockedNote: "Brave Shields und die Website-Freigabe sind von Braves Einstellung Bewegungssensoren getrennt.", phoneSensorsBlockedTitle: "Bewegungssensoren des Handys sind blockiert",
    phoneTilt: "Handy-Neigung", phoneTiltBlocked: "Browsersensor blockiert", phoneTiltOff: "aus", phoneTiltUnavailable: "Der Zugriff auf die Bewegungssensoren ist nicht verfügbar oder wurde nicht erlaubt.", phoneTiltWaiting: "wartet auf Handysensor",
    rotation: "Drehung", stopAll: "ALLES STOPPEN", stopMotif: "Motiv stoppen", stopPump: "Pumpe stoppen", stopRotation: "Drehung stoppen",
    status: Object.freeze({ health: "Zustand", label: "Sigmund-Status", lease: "Steuerung", link: "Verbindung", readOnly: "nur Anzeige", ready: "Sigmund bereit", recording: "Motivaufnahme", session: "Session" }),
    syringesReplay: "Spritzen und Wiedergabe", tilt: "Neigung", tiltEnabled: "Handy kalibriert",
    tiltDialogBody: "Das Handy in dem Winkel halten, der als waagerecht gelten soll. Beim Fortfahren wird der Bewegungszugriff angefordert, falls der Browser ihn verlangt, und die aktuelle Position als Neutralpunkt verwendet.",
    tiltDialogNote: "Die Neigungssteuerung bleibt nur aktiv, bis Neigung deaktivieren, Ausrichten, Malen beenden oder Alles stoppen gewählt wird.", tiltDialogTitle: "Handy-Neigung aktivieren?",
    testingSensors: "Sensoren werden getestet…", testSensorsAgain: "Sensoren erneut testen", title: "Soul Ink Mobile", waitsConfirmation: "wartet auf Bestätigung", xyJoystick: "XY-Joystick",
    sensorCheckAvailable: "Erfolg: Dieser Browser liefert aktuelle Bewegungssensordaten.", sensorCheckBody: "Diese Seite testet nur Browser und Handy. Sie koppelt sich nicht mit Sigmund und sendet keine Befehle.", sensorCheckTitle: "Handy-Sensortest", testPhoneSensors: "Handy-Sensoren testen",
    xyDelivery: xyDeliveryCopy,
    delivery: deliveryCopy,
  }),
});

/** Select the catalog from the stable English or German Studio route. */
export function mobileLocale(pathname = globalThis.location?.pathname || "/mobile/") {
  return pathname.startsWith("/de/") ? "de" : "en";
}
