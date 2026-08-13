/**
 * Descriptor: browser-shell actions that accompany safe painting-session shutdown.
 * Usage: App exits fullscreen while immediately neutralizing continuous Mobile controls.
 */

/** Start fullscreen exit and stop controls without waiting on either UI transition. Usage: End Painting. */
export async function stopPaintingAndExitFullscreen(fullscreen, client) {
  const exitRequest = fullscreen.exit();
  client.stopContinuous("session end");
  await exitRequest.catch(() => undefined);
}
