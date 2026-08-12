/**
 * Descriptor: pure XY joystick shaping that does not depend on Phaser or the browser canvas.
 * Usage: MobileScene polls plugin displacement and converts it into normalized Sigmund ratios.
 */

/** Clamp and shape one joystick axis for fine center control. Usage: joystick vector normalization. */
export function shapeAxis(value) {
  const clamped = Math.max(-1, Math.min(1, Number(value) || 0));
  if (clamped === 0) return 0;
  return Math.sign(clamped) * Math.abs(clamped) ** 1.7;
}

/** Convert the current joystick displacement into gantry-view ratios. Usage: Phaser frame polling. */
export function joystickVector(joystick) {
  const radius = joystick?.radius || 1;
  const x = shapeAxis((joystick?.forceX || 0) / radius);
  const y = shapeAxis((joystick?.forceY || 0) / radius);
  return {
    x_ratio: x === 0 ? 0 : -x,
    y_ratio: y === 0 ? 0 : -y,
  };
}
