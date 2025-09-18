import * as Phaser from "phaser";

export interface FloatingTextOptions {
  color?: string;
  x?: number;
  y?: number;
  depth?: number;
  fontSize?: string;
  durationMs?: number;
  rise?: number;
}

// Spawns a transient text element that floats upward and fades out.
export function spawnFloatingText(scene: Phaser.Scene, text: string, opts: FloatingTextOptions = {}) {
  const cam = scene.cameras.main;
  const x = opts.x ?? cam.width / 2;
  const y = opts.y ?? 40;
  const depth = opts.depth ?? 2000;
  const fontSize = opts.fontSize ?? "18px";
  const rise = opts.rise ?? 50;
  const duration = opts.durationMs ?? 2000;

  const txt = scene.add.text(x, y, text, {
    fontFamily: "monospace",
    fontSize,
    color: opts.color ?? "#ffffff"
  });
  txt.setOrigin(0.4, 0).setDepth(depth).setScrollFactor(0);
  scene.tweens.add({
    targets: txt,
    y: y - rise,
    alpha: 0,
    duration,
    onComplete: () => txt.destroy()
  });
  return txt;
}
