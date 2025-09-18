"use client";
import * as Phaser from "phaser";
import MainScene from "./MainScene";

export function createPhaserGame(parent: HTMLElement) {
  // Use the parent element size for responsive layout
  const parentRect = parent.getBoundingClientRect();
  const baseWidth = Math.max(640, Math.min(1280, Math.floor(parentRect.width)));
  const baseHeight = Math.max(420, Math.min(800, Math.floor(parentRect.height || 600)));

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: baseWidth,
    height: baseHeight,
    parent,
    backgroundColor: "#0b1220",
    scene: [MainScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: 1
    },
    render: {
      antialias: true,
      roundPixels: true,
      pixelArt: false,
      powerPreference: "high-performance",
      mipmapFilter: "LINEAR_MIPMAP_LINEAR"
    },
    dom: { createContainer: true }
  };
  const game = new Phaser.Game(config);

  // Ensure Phaser resizes with the parent container
  const ro = new ResizeObserver((entries) => {
    // If parent is detached or game is gone, skip
    if (!parent.isConnected || !(game as any) || !(game as any).scale) return;
    for (const entry of entries) {
      const cr = entry.contentRect;
      const w = Math.max(640, Math.min(1920, Math.floor(cr.width)));
      const h = Math.max(420, Math.min(1080, Math.floor(cr.height)));
      try {
        game.scale.resize(w, h);
      } catch {
        // Ignore if game was destroyed during a resize tick
      }
    }
  });
  ro.observe(parent);
  // Patch destroy to ensure observer disconnects to prevent post-destroy callbacks
  const originalDestroy = game.destroy.bind(game) as (removeCanvas?: boolean, noReturn?: boolean) => void;
  (game as any).destroy = (removeCanvas?: boolean, noReturn?: boolean) => {
    try {
      ro.disconnect();
    } catch {
      console.log("Failed to disconnect ResizeObserver, but continuing with destroy.");
    }
    originalDestroy(removeCanvas, noReturn);
  };
  (game as unknown as { __ro?: ResizeObserver }).__ro = ro;
  return game;
}
