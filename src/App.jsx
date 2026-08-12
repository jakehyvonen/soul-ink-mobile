/**
 * Descriptor: safe mobile painting workflow composed around authoritative Sigmund events.
 * Usage: main.jsx renders App; runtime-config.json selects local or Studio-paired transport.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { canOperate, initialPbmState, operationLabel, pbmReducer } from "./controlState.js";
import { mobileCopy, mobileLocale } from "./content.js";
import { loadRuntimeConfig } from "./runtimeConfig.js";
import { SigmundClient } from "./sigmundClient.js";
import { StudioPairing } from "./studioPairing.js";
import { useSafetyStops } from "./useSafetyStops.js";
import { routeXyVector } from "./xyControl.js";
import HoldControlButton from "./components/HoldControlButton.jsx";
import PhaserGame from "./components/PhaserGame/PhaserGame.jsx";
import StatusStrip from "./components/StatusStrip.jsx";

const TILT_RANGE_DEGREES = 31;

/** Request device-orientation permission within a user gesture. Usage: Enable phone tilt button. */
async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent === "undefined") return false;
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    return (await DeviceOrientationEvent.requestPermission()) === "granted";
  }
  return true;
}

/** Convert phone beta/gamma into normalized tilt ratios only. Usage: deviceorientation listener. */
export function orientationRatios(event) {
  const clamp = (value) => Math.max(-1, Math.min(1, (Number(value) || 0) / TILT_RANGE_DEGREES));
  return { u_ratio: clamp(event.beta), v_ratio: clamp(event.gamma) };
}

/** Render one task button with lifecycle text. Usage: workflow, syringe, and replay grids. */
function TaskButton({ state, operation, label, onClick, disabled = false, tone = "neutral" }) {
  const busy = new Set(["requested", "accepted", "running"]).has(state.operations[operation]?.status);
  return (
    <button type="button" className={`task-button ${tone}`} onClick={onClick} disabled={disabled || busy}>
      {operationLabel(state, operation, label)}
    </button>
  );
}

/** Bootstrap configuration, pairing, transport, and all mobile workflows. Usage: application root. */
export default function App() {
  const [state, dispatch] = useReducer(pbmReducer, initialPbmState);
  const [config, setConfig] = useState(null);
  const [client, setClient] = useState(null);
  const [pairing, setPairing] = useState(null);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const [tiltActive, setTiltActive] = useState(false);
  const locale = mobileLocale();
  const copy = mobileCopy[locale];
  const orientationRef = useRef({ u_ratio: 0, v_ratio: 0 });
  const fullscreen = useFullScreenHandle();
  const operatorReady = canOperate(state);
  useSafetyStops(client);

  useEffect(() => {
    let live = true;
    loadRuntimeConfig()
      .then(async (loaded) => {
        if (!live) return;
        let effectiveConfig = loaded;
        if (loaded.auth === "pairing") {
          const service = new StudioPairing();
          const pairedSession = await service.prepare();
          effectiveConfig = Object.freeze({ ...loaded, machineId: pairedSession.machineId });
          if (live) setPairing(service);
        }
        if (live) setConfig(effectiveConfig);
      })
      .catch((error) => dispatch({ type: "client.error", error: error.message }));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!config || (config.auth === "pairing" && !pairing)) return undefined;
    const nextClient = new SigmundClient(config, {
      admissionProvider: pairing ? () => pairing.getAdmission() : undefined,
    });
    const unsubscribe = nextClient.subscribe((event) => {
      if (event.type === "client.safety_stop") setTiltActive(false);
      dispatch({ ...event, localHolder: nextClient.holder });
    });
    setClient(nextClient);
    nextClient.connect();
    return () => {
      unsubscribe();
      nextClient.disconnect();
      setClient(null);
    };
  }, [config, pairing]);

  useEffect(() => {
    if (!orientationEnabled) return undefined;
    const updateOrientation = (event) => { orientationRef.current = orientationRatios(event); };
    window.addEventListener("deviceorientation", updateOrientation, true);
    return () => window.removeEventListener("deviceorientation", updateOrientation, true);
  }, [orientationEnabled]);

  useEffect(() => {
    if (!tiltActive || !client || !operatorReady) return undefined;
    const timer = setInterval(() => client.setControl("table_tilt", orientationRef.current), 53);
    return () => {
      clearInterval(timer);
      client.clearControl("table_tilt");
    };
  }, [client, operatorReady, tiltActive]);

  /** Run a discrete action without pretending it completed. Usage: all task buttons. */
  const runOperation = useCallback(async (name, type, fields = {}) => {
    const pending = client.sendRequest(type, fields);
    dispatch({ type: "operation.requested", name, requestId: pending.requestId });
    try {
      const result = await pending;
      dispatch({ type: "operation.accepted", name, requestId: result.request_id });
      return result;
    } catch (error) {
      dispatch({ type: "operation.failed", name, error: error.message });
      client?.logEvent("operation_failed", { operation: name, error: error.message });
      throw error;
    }
  }, [client]);

  /** Acquire operator control, then start one painting session/run. Usage: Begin Painting. */
  async function beginPainting() {
    try {
      await runOperation("lease", "lease.acquire", {
        mode: "operator",
        local_handoff: config.mode === "local",
      });
      if (state.machine?.xy?.estop) {
        const error = new Error("Pico E-stop is latched. Verify the machine is safe, then select Clear Stop.");
        dispatch({ type: "operation.failed", name: "painting_session_start", error: error.message });
        client?.logEvent("operation_failed", { operation: "painting_session_start", error: error.message });
        throw error;
      }
      const persistence = state.profile?.workflow_capabilities?.pbm?.persistence;
      if (persistence?.configured === false) {
        const error = new Error(persistence.message);
        dispatch({ type: "operation.failed", name: "painting_session_start", error: error.message });
        client?.logEvent("operation_failed", { operation: "painting_session_start", error: error.message });
        throw error;
      }
      await runOperation("painting_session_start", "painting_session_start");
      await fullscreen.enter();
    } catch {
      client?.stopContinuous("session start failed");
    }
  }

  /** Acquire control and run the confirmed Pi-owned recovery and centering sequence. Usage: Initialize Sigmund. */
  async function initializeMachine() {
    if (!window.confirm(copy.initializeConfirm)) return;
    try {
      await runOperation("lease", "lease.acquire", { mode: "operator" });
      await runOperation("machine_initialize", "machine.initialize");
    } catch {
      client?.stopContinuous("initialization failed");
    }
  }

  /** Clear a verified latched Pico stop without starting a session or output. Usage: explicit Clear Stop button. */
  async function clearMachineStop() {
    await runOperation("machine_clear_stop", "safety.clear_stop").catch(() => undefined);
  }

  /** Stop outputs, finish persistence, and release the lease in server order. Usage: End Painting. */
  async function endPainting() {
    setTiltActive(false);
    client.stopContinuous("session end");
    try {
      await runOperation("painting_session_end", "painting_session_end");
      await runOperation("lease_release", "lease.release");
    } catch {
      await client.stopAll().catch(() => undefined);
    }
  }

  /** Enable secure-context phone orientation. Usage: explicit user gesture button. */
  async function enableOrientation() {
    try {
      setOrientationEnabled(await requestOrientationPermission());
    } catch (error) {
      dispatch({ type: "client.error", error: error.message });
    }
  }

  /** Start or stop phone-controlled tilt without changing physical limits. Usage: tilt task button. */
  function toggleTilt() {
    if (tiltActive) {
      setTiltActive(false);
      client.clearControl("table_tilt");
    } else if (orientationEnabled && operatorReady) {
      setTiltActive(true);
    }
  }

  /** Route latest XY ratios only while the session owns control. Usage: Phaser callback. */
  const updateXy = useCallback((vector) => {
    routeXyVector(client, operatorReady, vector);
  }, [client, operatorReady]);

  const syringes = useMemo(() => state.profile?.syringes || [
    { id: 0, label: "Blue" }, { id: 1, label: "Red" }, { id: 2, label: "White" }, { id: 3, label: "Purple" },
  ], [state.profile]);
  const persistence = state.profile?.workflow_capabilities?.pbm?.persistence;

  if (!config) return <main className="boot-screen"><h1>{copy.title}</h1><p>{state.notice}</p></main>;

  return (
    <FullScreen handle={fullscreen}>
      <main className="pbm-app">
        <header>
          <div>
            <p className="eyebrow">{config.mode} · {config.machineId}</p>
            <h1>{copy.title}</h1>
          </div>
          {config.mode === "remote" && <a className="language-switch" href={locale === "de" ? "/mobile/" : "/de/mobile/"}>{copy.language}</a>}
          <button type="button" className="stop-all" disabled={state.connection !== "connected"} onClick={() => client.stopAll().catch((error) => dispatch({ type: "client.error", error: error.message }))}>
            {copy.stopAll}
          </button>
        </header>

        <StatusStrip state={state} />
        {state.fault.active && (
          <p className="fault-banner" role="alert">
            {String(state.fault.source).toUpperCase()} {state.fault.code}: {state.fault.message}
          </p>
        )}
        {persistence?.configured === false && (
          <p className="setup-banner" role="status">{persistence.message}</p>
        )}
        {state.profile?.workflow_capabilities?.pbm?.memory_mode && (
          <p className="hardware-test-banner" role="alert">
            {copy.localHardware}
          </p>
        )}
        <p className="notice" role="status">{state.notice}</p>
        {state.profile?.pbm_log?.path && (
          <details className="diagnostics">
            <summary>{copy.diagnostics}</summary>
            <code>PBM log: {state.profile.pbm_log.path}</code>
          </details>
        )}

        <section className="workflow-card" aria-label="Painting session">
          <div className="section-heading"><h2>{copy.paintingSession}</h2><span>{operatorReady ? copy.controlsLive : copy.readOnly}</span></div>
          <div className="button-row">
            <TaskButton state={state} operation="machine_initialize" label={copy.initialize} tone="warn" onClick={initializeMachine} disabled={state.session.active || state.connection !== "connected"} />
            <TaskButton state={state} operation="painting_session_start" label={copy.beginPainting} tone="good" onClick={beginPainting} disabled={state.session.active || state.connection !== "connected"} />
            <TaskButton state={state} operation="machine_clear_stop" label={copy.clearStop} tone="warn" onClick={clearMachineStop} disabled={!state.lease.owned} />
            <TaskButton state={state} operation="painting_session_end" label={copy.endPainting} tone="warn" onClick={endPainting} disabled={!state.session.active} />
            <TaskButton
              state={state}
              operation={state.recording.active ? "motif_recording_stop" : "motif_recording_start"}
              label={state.recording.active ? copy.stopMotif : copy.recordMotif}
              tone="record"
              onClick={() => runOperation(state.recording.active ? "motif_recording_stop" : "motif_recording_start", state.recording.active ? "motif_recording_stop" : "motif_recording_start").catch(() => undefined)}
              disabled={!operatorReady}
            />
          </div>
        </section>

        <div className="control-layout">
          <section className="joystick-card" aria-label="XY control">
            <div className="section-heading"><h2>{copy.xyJoystick}</h2><span>53 ms</span></div>
            <PhaserGame onVector={updateXy} disabled={!operatorReady} />
          </section>

          <section className="controls-card" aria-label="Continuous controls">
            <div className="section-heading"><h2>{copy.paintTable}</h2><span>{copy.releaseStops}</span></div>
            <div className="hold-grid">
              <HoldControlButton disabled={!operatorReady} onStart={() => client.setControl("paint_pump", { velocity_ratio: 1 })} onStop={() => client.clearControl("paint_pump")} tone="pump">{copy.holdDispense}</HoldControlButton>
              <button type="button" className="control-button stop" disabled={!operatorReady} onClick={() => client.stopControl("paint_pump")}>{copy.stopPump}</button>
              <HoldControlButton disabled={!operatorReady} onStart={() => client.setControl("table_rotation", { velocity_ratio: -1 })} onStop={() => client.clearControl("table_rotation")}>{copy.holdCcw}</HoldControlButton>
              <button type="button" className="control-button stop" disabled={!operatorReady} onClick={() => client.stopControl("table_rotation")}>{copy.stopRotation}</button>
              <HoldControlButton disabled={!operatorReady} onStart={() => client.setControl("table_rotation", { velocity_ratio: 1 })} onStop={() => client.clearControl("table_rotation")}>{copy.holdCw}</HoldControlButton>
              <button type="button" className={`control-button ${tiltActive ? "record" : "accent"}`} disabled={!operatorReady || !orientationEnabled} onClick={toggleTilt}>{tiltActive ? copy.stopTilt : copy.usePhoneTilt}</button>
              <TaskButton state={state} operation="table_level" label={copy.level} onClick={() => { setTiltActive(false); runOperation("table_level", "control.level").catch(() => undefined); }} disabled={!operatorReady} />
              <button type="button" className="control-button neutral" onClick={enableOrientation}>{orientationEnabled ? copy.tiltEnabled : copy.enablePhoneTilt}</button>
            </div>
          </section>
        </div>

        <section className="workflow-card" aria-label="Syringes and replay">
          <div className="section-heading"><h2>{copy.syringesReplay}</h2><span>{copy.waitsConfirmation}</span></div>
          <div className="task-grid">
            {syringes.map((syringe) => (
              <TaskButton key={syringe.id} state={state} operation={`syringe_${syringe.id}`} label={syringe.label || `Syringe ${syringe.id}`} onClick={() => runOperation(`syringe_${syringe.id}`, "syringe.select", { syringe_id: syringe.id }).catch(() => undefined)} disabled={!operatorReady} />
            ))}
            {(["gesture", "motif", "run"]).map((target) => (
              <TaskButton key={target} state={state} operation={`replay_${target}`} label={`${copy.replay} ${target}`} tone="replay" onClick={() => runOperation(`replay_${target}`, "replay", { target }).catch(() => undefined)} disabled={!operatorReady || !state.replay.available[target]} />
            ))}
          </div>
        </section>
      </main>
    </FullScreen>
  );
}
