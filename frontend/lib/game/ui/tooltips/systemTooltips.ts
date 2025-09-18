import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { BadSystemKey, GoodSystemKey } from "../../types";

export interface TooltipHost {
  scene: Phaser.Scene;
  getTooltipDom: () => Phaser.GameObjects.DOMElement | null;
  setTooltipDom: (dom: Phaser.GameObjects.DOMElement | null) => void;
  moveTooltip: (x: number, y: number) => void;
}

export function showTooltipForBad(host: TooltipHost, key: BadSystemKey, px: number, py: number) {
  const b = gameConfig.badSystems[key];
  const tickSec = gameConfig.tickDurationMs / 1000;
  const html = `
    <div style="max-width:220px;background:#111827e6;color:#e5e7eb;border:1px solid #1f2937;border-radius:6px;padding:8px;font-size:12px;backdrop-filter:blur(2px);">
      <div style="font-weight:700;margin-bottom:4px;">${b.name}</div>
      <div style="opacity:.85;margin-bottom:6px;">${b.blurb}</div>
      <div style="display:flex;gap:8px;">
        <span>Income: +${(b.resourceIncome / tickSec).toFixed(1)}/s</span>
        <span>${b.planetImpact > 0 ? "Damage" : "Heal"}: ${Math.abs(b.planetImpact / tickSec).toFixed(1)}/s</span>
      </div>
    </div>`;
  const existing = host.getTooltipDom();
  if (existing) existing.destroy();
  const dom = host.scene.add.dom(0, 0).createFromHTML(html).setDepth(30);
  host.setTooltipDom(dom);
  host.moveTooltip(px, py);
}

export function showTooltipForGood(host: TooltipHost, key: GoodSystemKey, px: number, py: number) {
  const g = gameConfig.goodSystems[key];
  const tickSec = gameConfig.tickDurationMs / 1000;
  const html = `
    <div style="max-width:240px;background:#111827e6;color:#e5e7eb;border:1px solid #1f2937;border-radius:6px;padding:8px;font-size:12px;backdrop-filter:blur(2px);">
      <div style="font-weight:700;margin-bottom:4px;">${g.name}</div>
      <div style="opacity:.85;margin-bottom:6px;">${g.blurb}</div>
      <div style="display:flex;gap:8px;">
        <span>Income: +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
        <span>Damage: ${(g.planetImpact / tickSec).toFixed(1)}/s</span>
      </div>
    </div>`;
  const existing = host.getTooltipDom();
  if (existing) existing.destroy();
  const dom = host.scene.add.dom(0, 0).createFromHTML(html).setDepth(30);
  host.setTooltipDom(dom);
  host.moveTooltip(px, py);
}
