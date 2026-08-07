/**
 * Descriptor: Focused Phaser scene for the PBM XY joystick and retained artwork.
 * Usage: PhaserGame creates this scene and forwards normalized vectors to SigmundClient.
 */
import Phaser from "phaser";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

/** Clamp and shape one joystick axis for fine center control. Usage: joystick update. */
export function shapeAxis(value) {
  const clamped = Math.max(-1, Math.min(1, Number(value) || 0));
  return Math.sign(clamped) * Math.abs(clamped) ** 1.7;
}

/**
 * Render one landscape-friendly joystick and publish latest XY intent.
 * Usage: PhaserGame passes an onVector callback; scene shutdown publishes neutral.
 */
export default class MobileScene extends Phaser.Scene {
  constructor(onVector) {
    super("pbm-mobile");
    this.onVector = onVector;
    this.joystick = null;
  }

  /** Load the original PBM joystick artwork. Usage: Phaser preload lifecycle. */
  preload() {
    this.load.image("base", "./assets/base.png");
    this.load.image("thumb", "./assets/thumb.png");
    this.load.plugin("pbm-virtual-joystick", VirtualJoystickPlugin, true);
  }

  /** Create the joystick and safety listeners. Usage: Phaser create lifecycle. */
  create() {
    const plugin = this.plugins.get("pbm-virtual-joystick");
    this.joystick = plugin.add(this, {
      x: 233,
      y: 233,
      radius: 113,
      base: this.add.image(0, 0, "base").setDisplaySize(367, 367),
      thumb: this.add.image(0, 0, "thumb").setDisplaySize(107, 107),
    });
    this.joystick.on("update", this.publishVector, this);
    this.input.on("pointerup", this.publishNeutral, this);
    this.input.on("pointerupoutside", this.publishNeutral, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.publishNeutral, this);
  }

  /** Publish shaped gantry-view ratios. Usage: joystick update callback. */
  publishVector() {
    if (!this.joystick) return;
    const radius = this.joystick.radius || 1;
    this.onVector({
      x_ratio: -shapeAxis(this.joystick.forceX / radius),
      y_ratio: -shapeAxis(this.joystick.forceY / radius),
    });
  }

  /** Publish explicit neutral XY intent. Usage: release, cancel, and scene shutdown. */
  publishNeutral() {
    this.onVector({ x_ratio: 0, y_ratio: 0 });
  }
}
