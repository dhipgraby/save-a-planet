import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { InstalledSystem } from "./types";

export class EconomySidebar {
  private scene: Phaser.Scene;
  private sidebarDom: Phaser.GameObjects.DOMElement | null = null;
  private prevIncomeTotal = 0;
  private prevImpactTotal = 0;
  private headerHeightFn: () => number;

  constructor(scene: Phaser.Scene, headerHeightFn: () => number) {
    this.scene = scene;
    this.headerHeightFn = headerHeightFn;
  }

  public ensure() {
    if (this.sidebarDom) return;
    const cam = this.scene.cameras.main;
    const width = Math.min(380, Math.max(280, Math.floor(cam.width * 0.28)));
    const x = cam.width - width - 12;
    const y = this.headerHeightFn() + 200;
    const html = `<div style="width:${width}px;max-height:${Math.floor(cam.height - 24)}px;overflow:auto;background:#0b1220cc;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;backdrop-filter:blur(4px);box-shadow:0 8px 24px rgba(0,0,0,.35)">
      <div style="padding:12px 12px 10px 12px;border-bottom:1px solid #1f2937;background:linear-gradient(180deg,rgba(17,24,39,.85),rgba(11,18,32,.85));border-top-left-radius:12px;border-top-right-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:800;">
          <img src="/game/coin.svg" width="18" height="18" alt="coins"/> Economy
        </div>
            <div style="display:flex;gap:8px;font-size:13px;">
              <span data-income style="padding:2px 8px;border-radius:999px;background:#3f2d0c;color:#fbbf24;border:1px solid #b45309;">+0/s</span>
              <span data-impact style="padding:2px 8px;border-radius:999px;background:#2a0d0d;color:#ef9a9a;border:1px solid #7f1d1d;">Damage 0/s</span>
        </div>
      </div>
      <div data-content style="padding:10px 12px 12px 12px;font-size:13px;opacity:.95;"></div>
    </div>`;
    this.sidebarDom = this.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(25);
  }

  public update(installed: InstalledSystem[]) {
    this.ensure();
    if (!this.sidebarDom) return;
    const content = (this.sidebarDom.node as HTMLElement).querySelector("[data-content]") as HTMLElement | null;
    if (!content) return;
    const tickSec = gameConfig.tickDurationMs / 1000;
    const rows = installed.map((s) => {
      const incPerSec = s.resourceIncome / tickSec;
      const impPerSec = s.planetImpact / tickSec;
      const isDamage = impPerSec > 0;
      const color = isDamage ? "#ef4444" : "#22c55e";
      const impLabel = isDamage
        ? `Damage ${impPerSec.toFixed(1)}/s`
        : `Heal ${Math.abs(impPerSec).toFixed(1)}/s`;
      return `<div style="display:flex;justify-content:space-between;gap:8px;margin:6px 0;">
        <span style="opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.key}</span>
                <span style="display:flex;gap:8px;">
                  <span style="color:#fbbf24;">+${incPerSec.toFixed(1)}/s</span>
                  <span style="color:${color};">${impLabel}</span>
                </span>
      </div>`;
    });
    const incomePerTick = installed.reduce((a, s) => a + s.resourceIncome, 0);
    const impactPerTick = installed.reduce((a, s) => a + s.planetImpact, 0);
    const income = incomePerTick / tickSec;
    const impact = impactPerTick / tickSec;
    const planetDeltaPerSec = (gameConfig.baseDecay + impactPerTick) / tickSec; // >0 damage per second, <0 heal per second
    content.innerHTML = `
      ${rows.join("")}
      <div style="margin-top:8px;border-top:1px solid #1f2937;padding-top:8px;display:flex;justify-content:space-between;">
        <b>Total</b>
        <span>
              <span style="color:#fbbf24;margin-right:10px;">+${income.toFixed(1)}/s</span>
              <span style="color:${impact > 0 ? "#ef4444" : "#22c55e"};">${impact > 0 ? `Damage ${impact.toFixed(1)}/s` : `Heal ${Math.abs(impact).toFixed(1)}/s`}</span>
        </span>
      </div>`;
    const root = this.sidebarDom.node as HTMLElement;
    const incChip = root.querySelector("[data-income]") as HTMLElement | null;
    const impChip = root.querySelector("[data-impact]") as HTMLElement | null;
    if (incChip) incChip.textContent = `+${income.toFixed(1)}/s`;
    if (impChip) {
      const isDamage = planetDeltaPerSec > 0;
      impChip.textContent = isDamage ? `Damage ${planetDeltaPerSec.toFixed(1)}/s` : `Heal ${Math.abs(planetDeltaPerSec).toFixed(1)}/s`;
      impChip.style.background = isDamage ? "#2a0d0d" : "#0d2a14";
      impChip.style.color = isDamage ? "#ef9a9a" : "#86efac";
      impChip.style.borderColor = isDamage ? "#7f1d1d" : "#166534";
    }
    if (incChip && income !== this.prevIncomeTotal) this.pulseDom(incChip);
    if (impChip && impact !== this.prevImpactTotal) this.pulseDom(impChip);
    this.prevIncomeTotal = income;
    this.prevImpactTotal = impact;
  }

  public reposition(width: number, height: number) {
    if (!this.sidebarDom) return;
    const widthSide = Math.min(380, Math.max(280, Math.floor(width * 0.28)));
    const x = width - widthSide - 12;
    const y = this.headerHeightFn() + 100;
    this.sidebarDom.setPosition(x, y);
    const root = this.sidebarDom.node as HTMLElement;
    root.style.width = `${widthSide}px`;
    root.style.maxHeight = `${Math.floor(height - (this.headerHeightFn() + 200) - 16)}px`;
  }

  private pulseDom(el: HTMLElement) {
    el.style.transition = "transform 120ms ease-out";
    el.style.transform = "scale(1.1)";
    window.setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 140);
  }
}
