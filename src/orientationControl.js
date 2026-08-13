/**
 * Descriptor: permission-aware, calibrated phone sensor mapping for substrate tilt.
 * Usage: App requests motion access and feeds orientation or gravity samples through OrientationTracker.
 */

export const TILT_RANGE_DEGREES = 31;
export const TILT_DEADZONE_DEGREES = 0.53;
export const TILT_FILTER_WEIGHT = 0.31;

/** Request every available phone-motion permission inside one user gesture. Usage: Enable Tilting. */
export async function requestPhoneMotionPermission(environment = globalThis) {
  const sensorApis = [environment?.DeviceOrientationEvent, environment?.DeviceMotionEvent].filter(Boolean);
  if (sensorApis.length === 0) return false;

  const decisions = sensorApis.map((sensorApi) => {
    if (typeof sensorApi.requestPermission !== "function") return Promise.resolve(true);
    try {
      return Promise.resolve(sensorApi.requestPermission())
        .then((decision) => decision === "granted")
        .catch(() => false);
    } catch {
      return Promise.resolve(false);
    }
  });
  return (await Promise.all(decisions)).some(Boolean);
}

/** Clamp one finite value into an inclusive range. Usage: angle and ratio normalization. */
function clamp(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(minimum, Math.min(maximum, number));
}

/** Return the shortest signed angular delta. Usage: tolerate deviceorientation wraparound. */
function angleDelta(current, baseline) {
  return ((current - baseline + 540) % 360) - 180;
}

/** Normalize a screen angle to the four browser orientation values. Usage: calibration and updates. */
function normalizeScreenAngle(screenAngle) {
  return ((Number(screenAngle) || 0) % 360 + 360) % 360;
}

/** Reject empty sensor events before they can become a false neutral pose. Usage: tracker samples. */
function sampleIsUsable(event) {
  return event?.beta !== null && event?.gamma !== null
    && Number.isFinite(Number(event?.beta)) && Number.isFinite(Number(event?.gamma));
}

/** Convert gravity-inclusive acceleration into beta/gamma-style angles. Usage: devicemotion fallback. */
export function accelerationAngles(event) {
  const acceleration = event?.accelerationIncludingGravity;
  const x = Number(acceleration?.x);
  const y = Number(acceleration?.y);
  const z = Number(acceleration?.z);
  if (![x, y, z].every(Number.isFinite)) return null;
  if (Math.hypot(x, y, z) < TILT_DEADZONE_DEGREES) return null;
  const degrees = 180 / Math.PI;
  return Object.freeze({
    beta: Math.atan2(-y, Math.hypot(x, z)) * degrees,
    gamma: Math.atan2(x, Math.hypot(y, z)) * degrees,
  });
}

/** Rotate beta/gamma into stable screen-relative U/V axes. Usage: portrait and landscape samples. */
export function screenRelativeAngles(event, screenAngle = 0) {
  const beta = clamp(event?.beta, -180, 180);
  const gamma = clamp(event?.gamma, -90, 90);
  const normalizedAngle = normalizeScreenAngle(screenAngle);
  if (normalizedAngle === 90) return { u: -gamma, v: beta };
  if (normalizedAngle === 180) return { u: -beta, v: -gamma };
  if (normalizedAngle === 270) return { u: gamma, v: -beta };
  return { u: beta, v: gamma };
}

/** Convert one relative angle to a normalized ratio with a small neutral deadband. Usage: tracker updates. */
function angleRatio(degrees) {
  if (Math.abs(degrees) <= TILT_DEADZONE_DEGREES) return 0;
  return clamp(degrees / TILT_RANGE_DEGREES, -1, 1);
}

/**
 * Calibrate the current phone attitude and smooth subsequent relative U/V samples.
 * Usage: create one tracker per mounted App and reset it when the user recalibrates.
 */
export class OrientationTracker {
  /** Create an uncalibrated tracker with neutral output. Usage: App initialization. */
  constructor() {
    this.reset();
  }

  /** Forget the baseline and restore neutral output. Usage: Enable or disable tilting. */
  reset() {
    this.baseline = null;
    this.screenAngle = 0;
    this.filtered = { u_ratio: 0, v_ratio: 0 };
  }

  /** Capture the current phone attitude as the no-motion pose. Usage: first sample after reset. */
  calibrate(event, screenAngle = 0) {
    if (!sampleIsUsable(event)) return this.snapshot();
    this.baseline = screenRelativeAngles(event, screenAngle);
    this.screenAngle = normalizeScreenAngle(screenAngle);
    this.filtered = { u_ratio: 0, v_ratio: 0 };
    return this.snapshot();
  }

  /** Produce a smoothed ratio relative to the calibrated phone pose. Usage: phone sensor listener. */
  update(event, screenAngle = 0) {
    if (!sampleIsUsable(event)) return this.snapshot();
    const normalizedAngle = normalizeScreenAngle(screenAngle);
    if (!this.baseline || normalizedAngle !== this.screenAngle) return this.calibrate(event, normalizedAngle);
    const current = screenRelativeAngles(event, screenAngle);
    const next = {
      u_ratio: angleRatio(angleDelta(current.u, this.baseline.u)),
      v_ratio: angleRatio(angleDelta(current.v, this.baseline.v)),
    };
    this.filtered = {
      u_ratio: this.filtered.u_ratio + TILT_FILTER_WEIGHT * (next.u_ratio - this.filtered.u_ratio),
      v_ratio: this.filtered.v_ratio + TILT_FILTER_WEIGHT * (next.v_ratio - this.filtered.v_ratio),
    };
    return this.snapshot();
  }

  /** Return immutable browser ratios and display degrees. Usage: App state and control sampling. */
  snapshot() {
    const ratios = Object.freeze({ ...this.filtered });
    return Object.freeze({
      calibrated: Boolean(this.baseline),
      ratios,
      degrees: Object.freeze({
        u: Math.round(ratios.u_ratio * TILT_RANGE_DEGREES * 10) / 10,
        v: Math.round(ratios.v_ratio * TILT_RANGE_DEGREES * 10) / 10,
      }),
    });
  }
}
