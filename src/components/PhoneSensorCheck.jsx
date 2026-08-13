/**
 * Descriptor: standalone phone-motion diagnostic that does not require pairing or machine access.
 * Usage: open /mobile/?sensor-test=1 on the phone and tap Test Phone Sensors.
 */
import { useState } from "react";
import { mobileCopy, mobileLocale } from "../content.js";
import { probePhoneMotionSensors } from "../orientationControl.js";

/** Detect the opt-in standalone sensor diagnostic URL. Usage: main application selection. */
export function sensorCheckRequested(search = globalThis.location?.search || "") {
  return new URLSearchParams(search).get("sensor-test") === "1";
}

/** Test real browser samples and show actionable Brave recovery. Usage: standalone phone QA. */
export default function PhoneSensorCheck() {
  const copy = mobileCopy[mobileLocale()];
  const [status, setStatus] = useState("idle");
  const [brave, setBrave] = useState(false);

  /** Request access and classify actual phone readings. Usage: Test Phone Sensors button. */
  async function testSensors() {
    setStatus("testing");
    const result = await probePhoneMotionSensors();
    setBrave(result.brave);
    setStatus(result.available ? "available" : "blocked");
  }

  return (
    <main className="boot-screen sensor-check-screen">
      <p className="eyebrow">{copy.title}</p>
      <h1>{copy.sensorCheckTitle}</h1>
      <p>{copy.sensorCheckBody}</p>
      {status === "available" && <p className="sensor-check-result good">{copy.sensorCheckAvailable}</p>}
      {status === "blocked" && (
        <section className="sensor-check-result blocked" aria-live="polite">
          <h2>{brave ? copy.braveSensorsBlockedTitle : copy.phoneSensorsBlockedTitle}</h2>
          <p>{brave ? copy.braveSensorsBlockedBody : copy.phoneSensorsBlockedBody}</p>
          {brave && <ol>{copy.braveSensorSteps.map((step) => <li key={step}>{step}</li>)}</ol>}
        </section>
      )}
      <button type="button" disabled={status === "testing"} onClick={testSensors}>
        {status === "testing" ? copy.testingSensors : copy.testPhoneSensors}
      </button>
    </main>
  );
}
