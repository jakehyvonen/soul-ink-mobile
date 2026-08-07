/**
 * Descriptor: React lifecycle wrapper for the focused PBM Phaser joystick scene.
 * Usage: App renders it with an onVector callback while an operator session is active.
 */
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import MobileScene from "./MobileScene.js";

/** Create and destroy one Phaser game with React. Usage: PBM control panel. */
export default function PhaserGame({ onVector, disabled }) {
  const hostRef = useRef(null);
  const callbackRef = useRef(onVector);
  callbackRef.current = onVector;

  useEffect(() => {
    const scene = new MobileScene((vector) => callbackRef.current(vector));
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      transparent: true,
      width: 467,
      height: 467,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [scene],
    });
    return () => game.destroy(true);
  }, []);

  return <div className={`joystick-shell${disabled ? " is-disabled" : ""}`} ref={hostRef} aria-label="XY joystick" />;
}
