import * as Phaser from "phaser";

export class StatsSidebar {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.DOMElement | null = null;
  private headerHeightFn: () => number;

  constructor(scene: Phaser.Scene, headerHeightFn: () => number) {
    this.scene = scene;
    this.headerHeightFn = headerHeightFn;
  }

  public ensure(populationHealth: number) {
    if (this.root) return;
    const cam = this.scene.cameras.main;
    const width = Math.min(400, Math.max(260, Math.floor(cam.width * 0.26)));
    const x = 12;
    const y = this.headerHeightFn() + 140; // push down to clear planet & bars
    const html = `<div style="width:${width}px;max-height:${Math.floor(cam.height - 24)}px;overflow:auto;background:#0b1220cc;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;backdrop-filter:blur(4px);box-shadow:0 8px 24px rgba(0,0,0,.35)">
      <div style="padding:12px;border-bottom:1px solid #1f2937;background:linear-gradient(180deg,rgba(17,24,39,.85),rgba(11,18,32,.85));border-top-left-radius:12px;border-top-right-radius:12px;display:flex;align-items:center;gap:8px;font-weight:800;">
        <img src="/game/coin.svg" width="18" height="18" alt="stats"/> Stats
      </div>
      <div style="padding:10px 12px 12px 12px;font-size:13px;opacity:.95;">
        <div style="white-space:nowrap;display:flex;justify-content:space-between;margin:6px 0;">
        <span style="white-space:nowrap;display:flex">
        <img style="margin-right:4px" src="/game/coin.svg" width="18" height="18" alt="stats"/> Resources</span><b data-res>0</b></div>
  <div style="white-space:nowrap;display:flex;justify-content:space-between;margin:6px 0;">
  <span style="white-space:nowrap;display:flex">
  <img style="margin-right:4px" src="/game/coin.svg" width="18" height="18" alt="stats"/> Income</span><b data-inc>+0/s</b></div>
      </div>
    </div>`;
    this.root = this.scene.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(25);
  }

  public update(values: { resources: number; incomePerSec: number; popCostPer10s: number; requiredPerSec: number; secondsUntilUpkeep: number; populationHealth: number }) {
    this.ensure(values.populationHealth);
    if (!this.root) return;
    const node = this.root.node as HTMLElement;
    const resEl = node.querySelector("[data-res]") as HTMLElement | null;
    const incEl = node.querySelector("[data-inc]") as HTMLElement | null;
    if (resEl) resEl.textContent = `${Math.floor(values.resources)}`;
    if (incEl) incEl.textContent = `+${values.incomePerSec.toFixed(1)}/s`;
  }

  public reposition(width: number, height: number) {
    if (!this.root) return;
    // If destroyed during fade/restart, null out and bail
    if ((this.root as any).destroyed) {
      this.root = null; return;
    }
    const widthSide = Math.min(340, Math.max(260, Math.floor(width * 0.26)));
    const x = 12;
    const y = this.headerHeightFn() + 140; // keep extra spacing on resize
    try {
      this.root.setPosition(x, y);
      const node = this.root.node as HTMLElement | null;
      if (!node) return;
      node.style.width = `${widthSide}px`;
      node.style.maxHeight = `${Math.floor(height - (this.headerHeightFn() + 200) - 16)}px`;
    } catch {
      // Ignore errors if reposition called mid-shutdown
    }
  }

  // Expose bottom Y to allow other panels (e.g., Economy) to stack underneath
  public bottomY(): number {
    if (!this.root) return this.headerHeightFn() + 140;
    if ((this.root as any).destroyed) {
      return this.headerHeightFn() + 140;
    }
    const node = this.root.node as HTMLElement | null;
    const height = node?.offsetHeight ?? 0;
    return (this.root.y ?? 0) + height;
  }
}
