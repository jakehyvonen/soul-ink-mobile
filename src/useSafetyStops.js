/**
 * Descriptor: browser lifecycle safety exits for all Soul Ink Mobile continuous controls.
 * Usage: App invokes useSafetyStops(client) once for its active transport.
 */
import { useEffect } from "react";

/** Stop continuous intent on blur, page hide, or visibility loss. Usage: App root. */
export function useSafetyStops(client) {
  useEffect(() => {
    if (!client) return undefined;
    const stopForBlur = () => client.stopContinuous("window blur");
    const stopForPageHide = () => client.stopContinuous("page hide");
    const stopForVisibility = () => {
      if (document.visibilityState !== "visible") client.stopContinuous("visibility loss");
    };
    window.addEventListener("blur", stopForBlur);
    window.addEventListener("pagehide", stopForPageHide);
    document.addEventListener("visibilitychange", stopForVisibility);
    return () => {
      window.removeEventListener("blur", stopForBlur);
      window.removeEventListener("pagehide", stopForPageHide);
      document.removeEventListener("visibilitychange", stopForVisibility);
    };
  }, [client]);
}
