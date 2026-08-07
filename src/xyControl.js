/**
 * Descriptor: Lease-aware XY joystick routing without Phaser dependencies.
 * Usage: App forwards Phaser vectors here; tests verify read-only silence and release stops.
 */

/** Route active XY intent and one explicit release stop. Usage: Phaser joystick callback. */
export function routeXyVector(client, operatorReady, vector) {
  if (!client || !operatorReady) return;
  if (vector.x_ratio === 0 && vector.y_ratio === 0) {
    client.clearControl("xy_joystick");
    return;
  }
  client.setControl("xy_joystick", vector);
}
