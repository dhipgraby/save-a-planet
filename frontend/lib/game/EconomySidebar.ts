import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { InstalledSystem } from "./types";

export class EconomySidebar {
  private scene: Phaser.Scene;
  private sidebarDom: Phaser.GameObjects.DOMElement | null = null;
  private prevIncomeTotal = 0;
  private prevImpactTotal = 0;
  private headerHeightFn: () => number;
  private topY: number | null = null;
  // throttle floating earnings animation
  private lastIncomeFloatAt = 0;

  // Create a gold floating DOM label above the income chip; tweens up and fades out, then destroys itself
  private showIncomeFloat(x: number, y: number, text: string) {
    const html = `<div style="position:absolute; transform:translate(0%, -50%); color:#fbbf24; font-family:monospace; font-size:12px; font-weight:700; text-shadow:0 1px 0 rgba(0,0,0,.6); pointer-events:none; z-index:999999;">${text}</div>`;
    const el = this.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(9999).setScrollFactor(0);
    // Make sure wrapper is on top in the DOM stacking context as well
    try { (el.node as HTMLElement).style.zIndex = "999999"; } catch { /* no-op */ }
    // Tween DOM element: rise a bit and fade
    this.scene.tweens.add({
      targets: el,
      y: y - 22,
      alpha: 0,
      duration: 1500,
      ease: "Sine.easeOut",
      onComplete: () => { try { el.destroy(); } catch { /* no-op */ } }
    });
  }

  constructor(scene: Phaser.Scene, headerHeightFn: () => number) {
    this.scene = scene;
    this.headerHeightFn = headerHeightFn;
  }

  public ensure(topY?: number) {
    if (this.sidebarDom) return;
    if (typeof topY === "number") this.topY = topY;
    const cam = this.scene.cameras.main;
    // Align width and left anchor with Stats panel
    const width = Math.min(400, Math.max(260, Math.floor(cam.width * 0.30)));
    const x = 12;
    const y = this.topY ?? this.headerHeightFn() + 100;
    const html = `<div style="width:${width}px;max-height:${Math.floor(cam.height - 24)}px;overflow:auto;background:#0b1220cc;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;backdrop-filter:blur(4px);box-shadow:0 8px 24px rgba(0,0,0,.35)">
      <div style="padding:12px 12px 10px 12px;border-bottom:1px solid #1f2937;background:linear-gradient(180deg,rgba(17,24,39,.85),rgba(11,18,32,.85));border-top-left-radius:12px;border-top-right-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:800;">
          <img src="/game/coin.svg" width="18" height="18" alt="coins"/> Economy
        </div>
        <div style="display:flex;gap:8px;font-size:13px;">
          <span data-income style="padding:2px 8px;border-radius:999px;background:#3f2d0c;color:#fbbf24;border:1px solid #b45309;white-space:nowrap;">🪙 +0/s</span>
          <span data-impact style="padding:2px 8px;border-radius:999px;background:#2a0d0d;color:#ef9a9a;border:1px solid #7f1d1d;white-space:nowrap;">🔥 Damage 0/s</span>
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
        <span style="opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${String(s.key).charAt(0).toUpperCase() + String(s.key).slice(1)}</span>
            <span style="display:flex;gap:8px;">
          <span style="color:#fbbf24;">🪙 +${incPerSec.toFixed(1)}/s</span>
          <span style="color:${color};">🔥 ${impLabel}</span>
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
      <span style="color:#fbbf24;margin-right:10px;">🪙 +${income.toFixed(1)}/s</span>
      <span style="color:${impact > 0 ? "#ef4444" : "#22c55e"};">🔥 ${impact > 0 ? `Damage ${impact.toFixed(1)}/s` : `Heal ${Math.abs(impact).toFixed(1)}/s`}</span>
        </span>
      </div>`;
    const root = this.sidebarDom.node as HTMLElement;
    const incChip = root.querySelector("[data-income]") as HTMLElement | null;
    const impChip = root.querySelector("[data-impact]") as HTMLElement | null;

    if (incChip) incChip.textContent = `🪙 +${income.toFixed(1)}/s`;
    if (impChip) {
      const isDamage = planetDeltaPerSec > 0;
      impChip.textContent = isDamage ? `🔥 Damage ${planetDeltaPerSec.toFixed(1)}/s` : `🔥 Heal ${Math.abs(planetDeltaPerSec).toFixed(1)}/s`;
      impChip.style.background = isDamage ? "#2a0d0d" : "#0d2a14";
      impChip.style.color = isDamage ? "#ef9a9a" : "#86efac";
      impChip.style.borderColor = isDamage ? "#7f1d1d" : "#166534";
    }
    // Upkeep chip removed per new design.
    if (incChip && income !== this.prevIncomeTotal) this.pulseDom(incChip);
    if (impChip && impact !== this.prevImpactTotal) this.pulseDom(impChip);
    this.prevIncomeTotal = income;
    this.prevImpactTotal = impact;

    // Spawn a floating DOM label over the income chip roughly once per second (to render above the DOM panel)
    if (income > 0 && incChip) {
      const now = this.scene.time.now;
      if (now - this.lastIncomeFloatAt >= Math.max(800, gameConfig.tickDurationMs * 0.8)) {
        const dom = this.sidebarDom;
        if (dom && !(dom as any).destroyed) {
          const root = dom.node as HTMLElement | null;
          if (root) {
            const chipRect = incChip.getBoundingClientRect();
            const rootRect = root.getBoundingClientRect();
            const relX = (chipRect.left - rootRect.left) + chipRect.width / 2;
            const relYTop = (chipRect.top - rootRect.top); // top edge of chip
            const x = dom.x + Math.floor(relX);
            const y = dom.y + Math.floor(relYTop) - 6; // slightly above the chip
            this.showIncomeFloat(x, y, `+${income.toFixed(1)}`);
            this.lastIncomeFloatAt = now;
          }
        }
      }
    }
  }

  public reposition(width: number, height: number, topY?: number) {
    if (!this.sidebarDom) return;
    // If Phaser DOM element was destroyed (possible during game over fade) bail out
    if ((this.sidebarDom as any).destroyed) {
      this.sidebarDom = null;
      return;
    }
    if (typeof topY === "number") this.topY = topY;
    const widthSide = Math.min(340, Math.max(260, Math.floor(width * 0.26)));
    const x = 12;
    const y = this.topY ?? this.headerHeightFn() + 100;
    try {
      this.sidebarDom.setPosition(x, y);
      const root = this.sidebarDom.node as HTMLElement | null;
      if (!root) return; // node can be null briefly during teardown
      root.style.width = `${widthSide}px`;
      root.style.maxHeight = `${Math.floor(height - (this.headerHeightFn() + 200) - 16)}px`;
    } catch {
      // Swallow errors if reposition called during shutdown / restart race
    }
  }

  private pulseDom(el: HTMLElement) {
    el.style.transition = "transform 120ms ease-out";
    el.style.transform = "scale(1.1)";
    window.setTimeout(() => {
      el.style.transform = "scale(1)";
    }, 140);
  }
}
