/**
 * Descriptor: opt-in, supervised small-motion checks through the normal Mobile control channel.
 * Usage: App exposes the checks only when the English route includes `?motion-check=1`.
 */

export const MOTION_CHECK_DURATION_MS = 107;
export const MOTION_CHECK_RATIO = 0.19;
export const ROTARY_CHECK_DURATION_MS = 307;
export const ROTARY_CHECK_RATIO = 0.11;
export const TILT_CHECK_RATIO = 11 / 31;

/** Wait for the bounded control window before neutralization. Usage: default motion-check timer. */
function waitForMotionWindow() {
  return new Promise((resolve) => setTimeout(resolve, MOTION_CHECK_DURATION_MS));
}

/** Detect explicit motion-check opt-in without changing controller authority. Usage: App rendering gate. */
export function motionCheckRequested(search = window.location.search) {
  return new URLSearchParams(search).get("motion-check") === "1";
}

/** Send one low XY intent and always neutralize it after 107 ms. Usage: supervised axis buttons. */
export async function runMotionCheck(client, vector, wait = waitForMotionWindow) {
  client.setControl("xy_joystick", vector);
  try {
    await wait();
  } finally {
    client.clearControl("xy_joystick");
  }
}

/** Send one direct U/V target for physical staging verification. Usage: supervised tilt buttons. */
export function runTiltCheck(client, vector) {
  client.setControl("table_tilt", vector);
}

/** Wait for one bounded low-speed rotary pulse before neutralization. Usage: supervised rotary buttons. */
function waitForRotaryWindow() {
  return new Promise((resolve) => setTimeout(resolve, ROTARY_CHECK_DURATION_MS));
}

/** Send one low rotary intent and always stop it. Usage: supervised rotary-direction buttons. */
export async function runRotaryCheck(client, direction, wait = waitForRotaryWindow) {
  client.setControl("table_rotation", { velocity_ratio: direction * ROTARY_CHECK_RATIO });
  try {
    await wait();
  } finally {
    client.clearControl("table_rotation");
  }
}
