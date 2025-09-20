import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { BadSystemKey, GoodSystemKey } from "../../types";

export class TooltipManager {
  private scene: Phaser.Scene;
  private dom: Phaser.GameObjects.DOMElement | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showForBad(key: BadSystemKey, px: number, py: number) {
    const b = gameConfig.badSystems[key];
    const tickSec = gameConfig.tickDurationMs / 1000;
    const html = `
      <div style="max-width:220px;background:#111827e6;color:#e5e7eb;border:1px solid #1f2937;border-radius:6px;padding:8px;font-size:12px;backdrop-filter:blur(2px);">
        <div style="font-weight:700;margin-bottom:4px;">${b.name}</div>
        <div style="opacity:.85;margin-bottom:6px;">${b.blurb}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>Income: +${(b.resourceIncome / tickSec).toFixed(1)}/s</span>
          <span>${b.planetImpact > 0 ? "Damage" : "Heal"}: ${Math.abs(b.planetImpact / tickSec).toFixed(1)}/s</span>
        </div>
      </div>`;
    this.spawn(html, px, py);
  }

  showForGood(key: GoodSystemKey, px: number, py: number) {
    const g = gameConfig.goodSystems[key];
    const tickSec = gameConfig.tickDurationMs / 1000;
    const html = `
      <div style="max-width:240px;background:#111827e6;color:#e5e7eb;border:1px solid #1f2937;border-radius:6px;padding:8px;font-size:12px;backdrop-filter:blur(2px);">
        <div style="font-weight:700;margin-bottom:4px;">${g.name}</div>
        <div style="opacity:.85;margin-bottom:6px;">${g.blurb}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span>Income: +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
          <span>Damage: ${(g.planetImpact / tickSec).toFixed(1)}/s</span>
        </div>
      </div>`;
    this.spawn(html, px, py);
  }

  move(px: number, py: number) {
    if (!this.dom) return;
    const cam = this.scene.cameras.main;
    const pad = 10;
    const approxW = 240;
    const approxH = 110;
    let x = px + pad;
    let y = py + pad;
    if (x + approxW > cam.width) x = px - approxW - pad;
    if (y + approxH > cam.height) y = py - approxH - pad;
    this.dom.setPosition(x, y);
  }

  hide() {
    if (this.dom) {
      this.dom.destroy(); this.dom = null;
    }
  }

  private spawn(html: string, px: number, py: number) {
    this.hide();
    this.dom = this.scene.add.dom(0, 0).createFromHTML(html).setDepth(30);
    this.move(px, py);
  }
}
