import * as Phaser from "phaser";

export class HudOverlay {
  private scene: Phaser.Scene;
  private hudText!: Phaser.GameObjects.Text;
  private planetBarBg!: Phaser.GameObjects.Graphics;
  private planetBarFill!: Phaser.GameObjects.Graphics;
  private populationBarBg!: Phaser.GameObjects.Graphics;
  private populationBarFill!: Phaser.GameObjects.Graphics;
  private planetLabel!: Phaser.GameObjects.Text;
  private populationLabel!: Phaser.GameObjects.Text;
  private topBar!: Phaser.GameObjects.Graphics;
  private topBarTitle!: Phaser.GameObjects.Text;
  private topBarLegend!: Phaser.GameObjects.Text;
  private installBarBg?: Phaser.GameObjects.Graphics;
  private installBarFill?: Phaser.GameObjects.Graphics;
  private installLabel?: Phaser.GameObjects.Text;
  private currentInstallTotal?: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createHeader() {
    const cam = this.scene.cameras.main;
    const h = this.headerHeight();
    this.topBar = this.scene.add.graphics().setDepth(8);
    this.topBar.clear().fillStyle(0x0b1220, 1).fillRect(0, 0, cam.width, h).lineStyle(1, 0x1f2937, 1).strokeRect(0.5, 0.5, cam.width - 1, h - 1);
    this.topBarTitle = this.scene.add.text(12, 10, "Save a Planet — MVP", { fontFamily: "monospace", fontSize: "18px", color: "#e5e7eb" }).setDepth(9);
    this.topBarLegend = this.scene.add
      .text(0, 14, "🟢 heals • 🔴 hurts", { fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" })
      .setDepth(9);
    const legendW = this.topBarLegend.width;
    this.topBarLegend.setPosition(cam.width - legendW - 12, 14);
  }

  public redrawHeader(width: number) {
    if (!this.topBar) return;
    this.topBar.clear().fillStyle(0x0b1220, 1).fillRect(0, 0, width, this.headerHeight()).lineStyle(1, 0x1f2937, 1).strokeRect(0.5, 0.5, width - 1, this.headerHeight() - 1);
    if (this.topBarTitle) this.topBarTitle.setPosition(12, 10);
    if (this.topBarLegend) {
      const legendW = this.topBarLegend.width;
      this.topBarLegend.setPosition(width - legendW - 12, 14);
    }
  }

  public reposition(width: number) {
    this.redrawHeader(width);
    // Redraw install bar background at new width/position if present
    if (this.installBarBg || this.installLabel) {
      const y = this.headerHeight() + 42;
      const w = 300;
      const x = width - w - 12;
      if (this.installLabel) this.installLabel.setPosition(x, y - 16);
      if (this.installBarBg) this.installBarBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y, w, 10, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y, w, 10, 6);
    }
  }

  public headerHeight() {
    return 44;
  }

  public createHudBars() {
    const x = 12;
    const y1 = this.headerHeight() + 52;
    const y2 = y1 + 36;
    const w = 320;
    const h = 14;
    this.planetBarBg = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(9);
    this.populationBarBg = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(9);
    this.planetBarFill = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(10);
    this.populationBarFill = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(10);
    this.planetLabel = this.scene.add.text(x, y1 - 16, "Planet", { fontFamily: "monospace", fontSize: "13px", color: "#e5e7eb" }).setDepth(10);
    this.populationLabel = this.scene.add.text(x, y2 - 16, "Population", { fontFamily: "monospace", fontSize: "13px", color: "#e5e7eb" }).setDepth(10);
    this.planetBarBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y1, w, h, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y1, w, h, 6);
    this.populationBarBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y2, w, h, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y2, w, h, 6);
    this.redrawBars(1, 1);
  }

  public redrawBars(planetPct: number, popPct: number) {
    const x = 12;
    const y1 = this.headerHeight() + 52;
    const y2 = y1 + 36;
    const w = 320;
    const h = 14;
    const colorForPlanet = (pct: number) => (pct > 0.66 ? 0x22c55e : pct > 0.33 ? 0xf59e0b : 0xef4444);
    const colorForPop = (pct: number) => (pct > 0.66 ? 0x38bdf8 : pct > 0.33 ? 0x60a5fa : 0x3b82f6);
    this.planetBarFill.clear().fillStyle(colorForPlanet(planetPct), 1).fillRoundedRect(x, y1, Math.max(1, Math.floor(w * planetPct)), h, 6);
    this.populationBarFill.clear().fillStyle(colorForPop(popPct), 1).fillRoundedRect(x, y2, Math.max(1, Math.floor(w * popPct)), h, 6);
  }

  public createHudText() {
    this.hudText = this.scene.add.text(12, this.headerHeight() + 4, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" }).setDepth(10);
  }

  public setHudText(text: string) {
    if (this.hudText) this.hudText.setText(text);
  }

  public showInstallUi(systemName: string, totalTicks: number) {
    const cam = this.scene.cameras.main;
    const y = this.headerHeight() + 12;
    const w = 300;
    const x = cam.width - w - 12;
    const h = 10;
    this.currentInstallTotal = totalTicks;
    if (!this.installBarBg) this.installBarBg = this.scene.add.graphics().setDepth(12);
    if (!this.installBarFill) this.installBarFill = this.scene.add.graphics().setDepth(13);
    if (!this.installLabel) this.installLabel = this.scene.add.text(x, y - 16, "", { fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" }).setDepth(13);
    this.installLabel.setText(`Installing ${systemName}`);
    this.installLabel.setPosition(x, y - 16);
    this.installBarBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y, w, h, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y, w, h, 6);
    this.installBarFill.clear();
  }

  public updateInstallProgress(remainingTicks: number | null) {
    if (!this.installBarFill || !this.currentInstallTotal || remainingTicks === null) {
      this.hideInstallUi();
      return;
    }
    const cam = this.scene.cameras.main;
    const y = this.headerHeight() + 40;
    const w = 300;
    const x = cam.width - w - 12;
    const h = 10;
    const done = (this.currentInstallTotal - remainingTicks) / this.currentInstallTotal;
    this.installBarFill.clear().fillStyle(0x38bdf8, 1).fillRoundedRect(x, y, Math.max(2, Math.floor(w * Math.max(0, Math.min(1, done)))), h, 6);
  }

  public hideInstallUi() {
    if (this.installBarBg) this.installBarBg.clear();
    if (this.installBarFill) this.installBarFill.clear();
    if (this.installLabel) this.installLabel.setText("");
    this.currentInstallTotal = undefined;
  }
}
