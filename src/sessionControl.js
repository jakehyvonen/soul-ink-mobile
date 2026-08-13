/**
 * Descriptor: browser-shell actions that accompany safe painting-session entry and shutdown.
 * Usage: App requests landscape fullscreen for painting and releases it while neutralizing controls.
 */

/** Enter fullscreen before requesting landscape, falling back to the portrait gate if locking fails. Usage: Begin Painting. */
export async function enterPaintingFullscreen(fullscreen, display = globalThis.screen) {
  await fullscreen.enter();
  try {
    if (typeof display?.orientation?.lock !== "function") return false;
    await display.orientation.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

/** Neutralize controls, unlock orientation, and exit fullscreen without waiting between safety actions. Usage: End Painting. */
export async function stopPaintingAndExitFullscreen(fullscreen, client, display = globalThis.screen) {
  client.stopContinuous("session end");
  try {
    display?.orientation?.unlock?.();
  } catch {
    // The browser may already have released its fullscreen-owned orientation lock.
  }
  const exitRequest = fullscreen.exit();
  await exitRequest.catch(() => undefined);
}
