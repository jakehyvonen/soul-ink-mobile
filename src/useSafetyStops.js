/**
 * Descriptor: browser lifecycle safety exits for all Soul Ink Mobile continuous controls.
 * Usage: App invokes useSafetyStops(client) once for its active transport.
 */
import { useEffect } from "react";

/** Stop continuous intent on backgrounding and renew ownership immediately on return. Usage: App root. */
export function useSafetyStops(client) {
  useEffect(() => {
    if (!client) return undefined;
    const stopForBlur = () => client.stopContinuous("window blur");
    const stopForPageHide = () => client.stopContinuous("page hide");
    const renewForFocus = () => { void client.renewLease(); };
    const handleVisibility = () => document.visibilityState === "visible"
      ? renewForFocus()
      : client.stopContinuous("visibility loss");
    window.addEventListener("blur", stopForBlur);
    window.addEventListener("focus", renewForFocus);
    window.addEventListener("pagehide", stopForPageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", stopForBlur);
      window.removeEventListener("focus", renewForFocus);
      window.removeEventListener("pagehide", stopForPageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [client]);
}
