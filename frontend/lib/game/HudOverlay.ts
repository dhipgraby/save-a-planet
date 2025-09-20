import * as Phaser from "phaser";

export class HudOverlay {
  private scene: Phaser.Scene;
  private minimal: boolean; // when true (intro) only show music button
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
  // Score box elements (below legend at right)
  private scoreBoxBg?: Phaser.GameObjects.Graphics;
  private scoreBoxText?: Phaser.GameObjects.Text;
  private scoreBoxOffsetY: number = 8; // tweak this to move score box down/up
  private scoreBoxWidth: number = 150;
  private scoreBoxHeight: number = 26;
  private installBarBg?: Phaser.GameObjects.Graphics;
  private installBarFill?: Phaser.GameObjects.Graphics;
  private installLabel?: Phaser.GameObjects.Text;
  private currentInstallTotal?: number;
  // Heal button
  private healBtnBg?: Phaser.GameObjects.Graphics;
  private healBtnText?: Phaser.GameObjects.Text;
  private healOnClick?: () => void;
  private healBtnBounds = { x: 10, y: 10, w: 120, h: 26 };
  private healBtnLastState: "ready" | "cooldown" | null = null;
  // Music toggle button
  private musicBtnBg?: Phaser.GameObjects.Graphics;
  private musicBtnText?: Phaser.GameObjects.Text;
  private musicOn: boolean = true;
  private musicBtnBounds = { x: 0, y: 0, w: 90, h: 22 };
  // Track last numeric values for labels
  private lastPlanetVal?: number;
  private lastPlanetMax?: number;
  private lastPopVal?: number;
  private lastPopMax?: number;
  // Mini info panel near population crowd
  private crowdInfoBg?: Phaser.GameObjects.Graphics;
  private crowdInfoText1?: Phaser.GameObjects.Text; // Resources needs for X people
  private crowdInfoText2?: Phaser.GameObjects.Text; // Required (10s)
  private crowdInfoText3?: Phaser.GameObjects.Text; // Next consumption in Ns
  private crowdInfoDot?: Phaser.GameObjects.Graphics; // colored status dot
  private crowdInfoLegend?: Phaser.GameObjects.Text; // legend text (Growing/Stable/Declining)
  private crowdInfoCoin?: Phaser.GameObjects.Image; // coin icon for resources required line

  constructor(scene: Phaser.Scene, minimal = false) {
    this.scene = scene;
    this.minimal = minimal;
  }

  // Centralized depth constants (very high to avoid being overshadowed)
  private static readonly DEPTH_BASE = 1000;
  private static readonly DEPTH_HEADER = HudOverlay.DEPTH_BASE + 0;
  private static readonly DEPTH_HEADER_TEXT = HudOverlay.DEPTH_BASE + 1;
  private static readonly DEPTH_SCORE_BG = HudOverlay.DEPTH_BASE + 2;
  private static readonly DEPTH_SCORE_TEXT = HudOverlay.DEPTH_BASE + 3;
  private static readonly DEPTH_BAR_BG = HudOverlay.DEPTH_BASE + 4;
  private static readonly DEPTH_BAR_FILL = HudOverlay.DEPTH_BASE + 5;
  private static readonly DEPTH_LABEL = HudOverlay.DEPTH_BASE + 6;
  private static readonly DEPTH_HUD_TEXT = HudOverlay.DEPTH_BASE + 7;
  private static readonly DEPTH_HEAL_BG = HudOverlay.DEPTH_BASE + 8;
  private static readonly DEPTH_HEAL_TEXT = HudOverlay.DEPTH_BASE + 9;
  private static readonly DEBUG = false; // toggle to true to show outlines/logs

  public redrawHeader(width: number) {
    if (!this.minimal) {
      if (this.topBar) {
        this.topBar.clear().fillStyle(0x0b1220, 1).fillRect(0, 0, width, this.headerHeight()).lineStyle(1, 0x1f2937, 1).strokeRect(0.5, 0.5, width - 1, this.headerHeight() - 1);
      }
      if (this.topBarTitle) this.topBarTitle.setPosition(12, 12);
      if (this.topBarLegend) {
        const legendW = this.topBarLegend.width;
        this.topBarLegend.setPosition(width - legendW - 12, 18);
      }
      if (this.scoreBoxBg || this.scoreBoxText) {
        const boxW = this.scoreBoxWidth;
        const boxH = this.scoreBoxHeight;
        const x = width - boxW - 12;
        const y = this.headerHeight() + this.scoreBoxOffsetY;
        if (this.scoreBoxBg) this.scoreBoxBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y, boxW, boxH, 8).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y, boxW, boxH, 8);
        if (this.scoreBoxText) this.scoreBoxText.setPosition(x + boxW / 2, y + boxH / 2).setOrigin(0.5);
      }
      if (this.healBtnBg && this.healBtnBounds) {
        const layout = this.computeBarLayout();
        const w = this.healBtnBounds.w;
        const h = this.healBtnBounds.h;
        const xCenter = layout.planetX + layout.planetW / 2 - w / 2;
        const yPos = layout.planetY + layout.h + 10;
        this.healBtnBounds.x = xCenter;
        this.healBtnBounds.y = yPos;
        this.healBtnBg.setPosition(xCenter, yPos);
        this.healBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
        this.drawHealButton(0, 0, w, h);
        if (this.healBtnText) this.healBtnText.setPosition(xCenter + w / 2, yPos + h / 2);
      }
    }
    if (this.musicBtnBg && this.musicBtnText) {
      const w = this.musicBtnBounds.w;
      const h = this.musicBtnBounds.h;
      const x = width - w - 12;
      const y = 12;
      this.musicBtnBounds.x = x;
      this.musicBtnBounds.y = y;
      this.musicBtnBg.setPosition(x, y);
      this.drawMusicButton(0, 0, w, h);
      this.musicBtnText.setPosition(x + w / 2, y + h / 2);
    }
  }

  public headerHeight() {
    return 56;
  }

  public createHudBars() {
    if (this.minimal) return;
    const layout = this.computeBarLayout();
    const { planetX, planetY, popX, popY } = layout;
    this.planetBarBg = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_BAR_BG).setScrollFactor(0);
    this.populationBarBg = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_BAR_BG).setScrollFactor(0);
    this.planetBarFill = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_BAR_FILL).setScrollFactor(0);
    this.populationBarFill = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_BAR_FILL).setScrollFactor(0);
    this.planetLabel = this.scene.add.text(planetX, planetY - 16, "Planet", { fontFamily: "monospace", fontSize: "13px", color: "#e5e7eb" }).setDepth(HudOverlay.DEPTH_LABEL).setScrollFactor(0);
    this.populationLabel = this.scene.add.text(popX, popY - 16, "Population", { fontFamily: "monospace", fontSize: "13px", color: "#e5e7eb" }).setDepth(HudOverlay.DEPTH_LABEL).setScrollFactor(0);
    this.drawBarBackgrounds(layout);
    this.redrawBars(1, 1);
  }

  public redrawBars(planetPct: number, popPct: number) {
    // In minimal mode (intro), bars are not created and should not render
    if (this.minimal) return;
    // Ensure bars exist; if not, create them (e.g., after switching from minimal to full)
    if (!this.planetBarBg || !this.populationBarBg || !this.planetBarFill || !this.populationBarFill) {
      this.createHudBars();
      if (!this.planetBarBg || !this.populationBarBg || !this.planetBarFill || !this.populationBarFill) return;
    }
    const layout = this.computeBarLayout();
    const { planetX, planetY, planetW, popX, popY, popW, h } = layout;
    // Always redraw backgrounds so alignment stays correct after resizes or planet size changes
    this.drawBarBackgrounds(layout);
    const colorForPlanet = (pct: number) => (pct > 0.66 ? 0x22c55e : pct > 0.33 ? 0xf59e0b : 0xef4444);
    const colorForPop = (pct: number) => (pct > 0.66 ? 0x38bdf8 : pct > 0.33 ? 0x60a5fa : 0x3b82f6);
    this.planetBarFill.clear().fillStyle(colorForPlanet(planetPct), 1).fillRoundedRect(planetX, planetY, Math.max(1, Math.floor(planetW * planetPct)), h, 6);
    this.populationBarFill.clear().fillStyle(colorForPop(popPct), 1).fillRoundedRect(popX, popY, Math.max(1, Math.floor(popW * popPct)), h, 6);
    // Also reposition labels if they exist (responsive)
    if (this.planetLabel) this.planetLabel.setPosition(planetX, planetY - 16);
    if (this.populationLabel) this.populationLabel.setPosition(popX, popY - 16);
    // Refresh numeric values if we have them
    if (this.lastPlanetVal !== undefined && this.lastPlanetMax !== undefined && this.planetLabel) {
      this.planetLabel.setText(`Planet ${this.lastPlanetVal.toFixed(0)}/${this.lastPlanetMax}`);
    }
    if (this.lastPopVal !== undefined && this.lastPopMax !== undefined && this.populationLabel) {
      this.populationLabel.setText(`Population ${this.lastPopVal.toFixed(0)}/${this.lastPopMax}`);
    }
  }

  public createHudText() {
    if (this.minimal) return;
    this.hudText = this.scene.add.text(12, this.headerHeight() - 30, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" }).setDepth(HudOverlay.DEPTH_HUD_TEXT).setScrollFactor(0);
  }

  public setHudText(text: string) {
    if (this.minimal) return;
    // Guard against cases where hudText was never created or got destroyed by a scene restart
    if (!this.hudText || (this.hudText as any).destroyed) {
      this.createHudText();
    }
    // If the scene is shutting down or has been stopped, avoid touching the text (Phaser may have nulled canvas/context)
    const sys: any = this.scene.sys as any;
    const status = sys?.settings?.status;
    // Phaser status constants: 1=INIT, 2=START, 3=LOADING, 4=CREATING, 5=RUNNING, 6=PAUSED, 7=SLEEPING, 8=SHUTDOWN, 9=DESTROYED (values vary by version)
    if (status === Phaser.Scenes.SHUTDOWN || status === Phaser.Scenes.DESTROYED) {
      return; // silently ignore late calls
    }
    // If somehow invisible, force it visible & proper depth
    if (!this.hudText.visible) {
      this.hudText.setVisible(true).setDepth(HudOverlay.DEPTH_HUD_TEXT).setScrollFactor(0);
    }
    this.hudText.setText(text);
  }

  public showInstallUi(systemName: string, totalTicks: number) {
    const cam = this.scene.cameras.main;
    const y = this.headerHeight() + 52;
    const w = 300;
    const x = cam.width - w - 12;
    const h = 10;
    this.currentInstallTotal = totalTicks;
    if (!this.installBarBg) this.installBarBg = this.scene.add.graphics().setDepth(HudOverlay.DEPTH_BAR_BG).setScrollFactor(0);
    if (!this.installBarFill) this.installBarFill = this.scene.add.graphics().setDepth(HudOverlay.DEPTH_BAR_FILL + 1).setScrollFactor(0);
    if (!this.installLabel) this.installLabel = this.scene.add.text(x, y - 16, "", { fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" }).setDepth(HudOverlay.DEPTH_LABEL).setScrollFactor(0);
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
    const y = this.headerHeight() + 52;
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

  // ---- Heal button API ----
  public createHealButton(onClick: () => void) {
    if (this.minimal) return;
    this.healOnClick = onClick;
    const layout = this.computeBarLayout();
    const w = this.healBtnBounds.w;
    const h = this.healBtnBounds.h;
    // Center below planet bar
    const x = layout.planetX + layout.planetW / 2 - w / 2;
    const y = layout.planetY + layout.h + 10; // gap below bar
    this.healBtnBounds.x = x;
    this.healBtnBounds.y = y;
    if (!this.healBtnBg) {
      this.healBtnBg = this.scene.add.graphics({ x, y }).setDepth(HudOverlay.DEPTH_HEAL_BG).setScrollFactor(0);
    } else {
      this.healBtnBg.setPosition(x, y);
    }
    // Use local coordinates for hit area (0,0,w,h) to avoid world offset issues
    this.healBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    if (!this.healBtnText) {
      this.healBtnText = this.scene.add.text(x + w / 2, y + h / 2, "🩹 Heal 10%", { fontFamily: "monospace", fontSize: "12px", color: "#0b1220" }).setDepth(HudOverlay.DEPTH_HEAL_TEXT).setOrigin(0.5).setScrollFactor(0);
    } else {
      this.healBtnText.setPosition(x + w / 2, y + h / 2);
    }
    this.drawHealButton(0, 0, w, h, 0x10b981, 0x065f46); // draw at local 0,0 inside graphics
    this.healBtnBg.removeAllListeners();
    this.healBtnBg.on("pointerdown", () => {
      if (this.healOnClick) {
        // Debug log to confirm pointerdown firing
        // eslint-disable-next-line no-console
        console.debug("[HUD] Heal button clicked");
        this.healOnClick();
      }
    });
    this.healBtnBg.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      this.drawHealButton(0, 0, this.healBtnBounds.w, this.healBtnBounds.h, 0x34d399, 0x047857);
      if (this.healBtnText) this.healBtnText.setColor("#061318");
    });
    this.healBtnBg.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      this.drawHealButton(0, 0, this.healBtnBounds.w, this.healBtnBounds.h, 0x10b981, 0x065f46);
      if (this.healBtnText) this.healBtnText.setColor("#0b1220");
    });
  }

  // Music button API (called from scene after HUD exists)
  public createMusicButton(onToggle: (on: boolean) => void) {
    const w = this.musicBtnBounds.w;
    const h = this.musicBtnBounds.h;
    const cam = this.scene.cameras.main;
    const x = cam.width - w - 12;
    const y = 12;
    this.musicBtnBounds.x = x; this.musicBtnBounds.y = y;
    if (!this.musicBtnBg) {
      this.musicBtnBg = this.scene.add.graphics({ x, y }).setDepth(HudOverlay.DEPTH_HEAL_BG).setScrollFactor(0); // reuse depth tier
    } else {
      this.musicBtnBg.setPosition(x, y);
    }
    this.musicBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    if (!this.musicBtnText) {
      this.musicBtnText = this.scene.add.text(x + w / 2, y + h / 2, "Music: On", { fontFamily: "monospace", fontSize: "11px", color: "#0b1220" }).setDepth(HudOverlay.DEPTH_HEAL_TEXT).setOrigin(0.5).setScrollFactor(0);
    } else {
      this.musicBtnText.setPosition(x + w / 2, y + h / 2).setOrigin(0.5);
    }
    this.drawMusicButton(0, 0, w, h, 0xfbbf24, 0xb45309);
    this.musicBtnBg.removeAllListeners();
    this.musicBtnBg.on("pointerdown", () => {
      this.musicOn = !this.musicOn;
      if (this.musicBtnText) this.musicBtnText.setText(`Music: ${this.musicOn ? "On" : "Off"}`);
      this.drawMusicButton(0, 0, w, h, this.musicOn ? 0xfbbf24 : 0x6b7280, this.musicOn ? 0xb45309 : 0x374151);
      onToggle(this.musicOn);
    });
    this.musicBtnBg.on("pointerover", () => {
      this.scene.input.setDefaultCursor("pointer");
      this.drawMusicButton(0, 0, w, h, this.musicOn ? 0xfcd34d : 0x9ca3af, this.musicOn ? 0xb45309 : 0x4b5563);
    });
    this.musicBtnBg.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
      this.drawMusicButton(0, 0, w, h, this.musicOn ? 0xfbbf24 : 0x6b7280, this.musicOn ? 0xb45309 : 0x374151);
    });
    // Ensure initial label/style matches current state
    this.setMusicOn(this.musicOn);
  }

  private drawMusicButton(localX: number, localY: number, w: number, h: number, fill = 0xfbbf24, stroke = 0xb45309) {
    if (!this.musicBtnBg) return;
    this.musicBtnBg
      .clear()
      .fillStyle(0x000000, 0.25)
      .fillRoundedRect(localX + 2, localY + 2, w, h, 6)
      .fillStyle(fill, 1)
      .fillRoundedRect(localX, localY, w, h, 6)
      .lineStyle(1, stroke, 1)
      .strokeRoundedRect(localX, localY, w, h, 6);
  }

  public setScore(score: number) {
    if (this.minimal) return;
    if (!this.scoreBoxText) return;
    this.scoreBoxText.setText(`Score: ${score}`);
  }

  // Public setter to sync music button visual state
  public setMusicOn(on: boolean) {
    this.musicOn = on;
    const w = this.musicBtnBounds.w;
    const h = this.musicBtnBounds.h;
    if (this.musicBtnText) this.musicBtnText.setText(`Music: ${this.musicOn ? "On" : "Off"}`);
    this.drawMusicButton(0, 0, w, h, this.musicOn ? 0xfbbf24 : 0x6b7280, this.musicOn ? 0xb45309 : 0x374151);
  }

  public updateHealButtonCooldown(secondsLeft: number) {
    if (this.minimal) return;
    if (!this.healBtnBg || !this.healBtnText) return;
    if (secondsLeft > 0) {
      if (this.healBtnLastState !== "cooldown" || !this.healBtnText.text.startsWith("Heal in")) {
        this.drawHealButton(0, 0, this.healBtnBounds.w, this.healBtnBounds.h, 0x6b7280, 0x374151);
        this.healBtnText.setColor("#e5e7eb");
        this.healBtnLastState = "cooldown";
      }
      this.healBtnText.setText(`Heal in ${secondsLeft}s`);
      if ((this.healBtnBg as any).input?.enabled) this.healBtnBg.disableInteractive();
    } else {
      if (this.healBtnLastState !== "ready") {
        this.drawHealButton(0, 0, this.healBtnBounds.w, this.healBtnBounds.h, 0x10b981, 0x065f46);
        this.healBtnText.setText("🩹 Heal 10%").setColor("#0b1220");
        this.healBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.healBtnBounds.w, this.healBtnBounds.h), Phaser.Geom.Rectangle.Contains);
        this.healBtnLastState = "ready";
      }
    }
  }

  private drawHealButton(localX: number, localY: number, w: number, h: number, fill = 0x10b981, stroke = 0x065f46) {
    if (!this.healBtnBg) return;
    this.healBtnBg
      .clear()
      .fillStyle(0x000000, 0.22)
      .fillRoundedRect(localX + 2, localY + 2, w, h, 8)
      .fillStyle(fill, 1)
      .fillRoundedRect(localX, localY, w, h, 8)
      .lineStyle(1, stroke, 1)
      .strokeRoundedRect(localX, localY, w, h, 8);
  }

  // Force all HUD elements to be visible and in front
  public forceVisibility() {
    if (this.minimal) {
      const cam = this.scene.cameras.main;
      this.redrawHeader(cam.width);
      if (this.musicBtnBg) this.musicBtnBg.setVisible(true);
      if (this.musicBtnText) this.musicBtnText.setVisible(true);
      return;
    }
    // Ensure top bar is visible
    if (this.topBar) this.topBar.setVisible(true).setDepth(HudOverlay.DEPTH_HEADER).setScrollFactor(0);
    if (this.topBarTitle) this.topBarTitle.setVisible(true).setDepth(HudOverlay.DEPTH_HEADER_TEXT).setScrollFactor(0);
    if (this.topBarLegend) this.topBarLegend.setVisible(true).setDepth(HudOverlay.DEPTH_HEADER_TEXT).setScrollFactor(0);

    // Ensure score box is visible
    if (this.scoreBoxBg) this.scoreBoxBg.setVisible(true).setDepth(HudOverlay.DEPTH_SCORE_BG).setScrollFactor(0);
    if (this.scoreBoxText) this.scoreBoxText.setVisible(true).setDepth(HudOverlay.DEPTH_SCORE_TEXT).setScrollFactor(0);

    // Ensure bars are visible
    if (this.planetBarBg) this.planetBarBg.setVisible(true).setDepth(HudOverlay.DEPTH_BAR_BG).setScrollFactor(0);
    if (this.populationBarBg) this.populationBarBg.setVisible(true).setDepth(HudOverlay.DEPTH_BAR_BG).setScrollFactor(0);
    if (this.planetBarFill) this.planetBarFill.setVisible(true).setDepth(HudOverlay.DEPTH_BAR_FILL).setScrollFactor(0);
    if (this.populationBarFill) this.populationBarFill.setVisible(true).setDepth(HudOverlay.DEPTH_BAR_FILL).setScrollFactor(0);
    if (this.planetLabel) this.planetLabel.setVisible(true).setDepth(HudOverlay.DEPTH_LABEL).setScrollFactor(0);
    if (this.populationLabel) this.populationLabel.setVisible(true).setDepth(HudOverlay.DEPTH_LABEL).setScrollFactor(0);

    // Ensure hud text is visible
    if (this.hudText) this.hudText.setVisible(true).setDepth(HudOverlay.DEPTH_HUD_TEXT).setScrollFactor(0);

    // Ensure heal button is visible
    if (this.healBtnBg) this.healBtnBg.setVisible(true).setDepth(HudOverlay.DEPTH_HEAL_BG).setScrollFactor(0);
    if (this.healBtnText) this.healBtnText.setVisible(true).setDepth(HudOverlay.DEPTH_HEAL_TEXT).setScrollFactor(0);

    // Ensure music button is visible
    if (this.musicBtnBg) this.musicBtnBg.setVisible(true).setDepth(HudOverlay.DEPTH_HEAL_BG).setScrollFactor(0);
    if (this.musicBtnText) this.musicBtnText.setVisible(true).setDepth(HudOverlay.DEPTH_HEAL_TEXT).setScrollFactor(0);

    // Redraw header to ensure it's properly sized
    const cam = this.scene.cameras.main;
    this.redrawHeader(cam.width);
    // Bring to top explicitly (in case other systems added later at high depth)
    const bring = (obj?: Phaser.GameObjects.GameObject) => obj && this.scene.children.bringToTop(obj);
    const objs = [this.topBar, this.topBarTitle, this.topBarLegend, this.scoreBoxBg, this.scoreBoxText, this.planetBarBg, this.populationBarBg, this.planetBarFill, this.populationBarFill, this.planetLabel, this.populationLabel, this.hudText, this.healBtnBg, this.healBtnText, this.musicBtnBg, this.musicBtnText];
    objs.forEach(bring);
    if (HudOverlay.DEBUG) {
      // Log depth & visibility once per forceVisibility call
      const summary = objs.map(o => o ? { name: o.type, depth: (o as any).depth, visible: (o as any).visible } : null);
      // eslint-disable-next-line no-console
      console.warn("[HUD DEBUG] forceVisibility summary", summary);
    }
  }

  private computeBarLayout(): { planetX: number; planetY: number; planetW: number; popX: number; popY: number; popW: number; h: number } {
    const cam = this.scene.cameras.main;
    const planetSize = (this.scene as any).planetSizePx ?? 360;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const h = 14;
    // Planet bar directly under planet
    const planetW = Math.min(planetSize * 0.9, 420);
    const planetX = cx - planetW / 2;
    const planetY = cy + planetSize / 2 + 24; // push bars further down for larger planet spacing
    // Population bar aligned to same baseline as planet bar
    const baseOffsetX = 260; // keep in sync with PopulationVisuals.baseOffsetX
    const crowdOffset = planetSize / 2 + baseOffsetX * (planetSize / 400);
    const popW = 300;
    let popX = cx + crowdOffset - popW / 2;
    const popY = planetY; // same Y alignment
    // Clamp inside screen
    popX = Math.min(Math.max(12, popX), cam.width - popW - 12);
    return { planetX, planetY, planetW: planetW, popX, popY, popW, h };
  }

  private drawBarBackgrounds(layout: { planetX: number; planetY: number; planetW: number; popX: number; popY: number; popW: number; h: number }) {
    const { planetX, planetY, planetW, popX, popY, popW, h } = layout;
    if (this.planetBarBg) {
      this.planetBarBg.clear().fillStyle(0x0f172a, 0.95).fillRoundedRect(planetX, planetY, planetW, h, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(planetX, planetY, planetW, h, 6);
      if (HudOverlay.DEBUG) this.planetBarBg.lineStyle(1, 0x10b981, 0.4).strokeRoundedRect(planetX + 1, planetY + 1, planetW - 2, h - 2, 5);
    }
    if (this.populationBarBg) {
      this.populationBarBg.clear().fillStyle(0x0f172a, 0.95).fillRoundedRect(popX, popY, popW, h, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(popX, popY, popW, h, 6);
      if (HudOverlay.DEBUG) this.populationBarBg.lineStyle(1, 0x10b981, 0.4).strokeRoundedRect(popX + 1, popY + 1, popW - 2, h - 2, 5);
    }
  }

  // Update numeric values shown in labels (called from MainScene)
  public setBarValues(planetVal: number, planetMax: number, popVal: number, popMax: number) {
    if (this.minimal) return;
    this.lastPlanetVal = planetVal;
    this.lastPlanetMax = planetMax;
    this.lastPopVal = popVal;
    this.lastPopMax = popMax;
    if (this.planetLabel) this.planetLabel.setText(`Planet ${planetVal.toFixed(0)}/${planetMax}`);
    if (this.populationLabel) this.populationLabel.setText(`Population ${popVal.toFixed(0)}/${popMax}`);
  }

  public reposition(width: number) {
    if (this.minimal) {
      this.redrawHeader(width); return;
    }
    // Extend reposition to also move heal button below bars after any resize
    this.redrawHeader(width);
    if (this.installBarBg || this.installLabel) {
      const y = this.headerHeight() + 52;
      const w = 300;
      const x = width - w - 12;
      if (this.installLabel) this.installLabel.setPosition(x, y - 16);
      if (this.installBarBg) this.installBarBg.clear().fillStyle(0x0f172a, 1).fillRoundedRect(x, y, w, 10, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(x, y, w, 10, 6);
    }
    // Move heal button if present
    if (this.healBtnBg && this.healBtnText) {
      const layout = this.computeBarLayout();
      const w = this.healBtnBounds.w;
      const h = this.healBtnBounds.h;
      const x = layout.planetX + layout.planetW / 2 - w / 2;
      const y = layout.planetY + layout.h + 10;
      this.healBtnBounds.x = x; this.healBtnBounds.y = y;
      this.healBtnBg.setPosition(x, y);
      this.drawHealButton(0, 0, w, h);
      this.healBtnText.setPosition(x + w / 2, y + h / 2).setOrigin(0.5);
      if ((this.healBtnBg as any).input?.enabled) {
        this.healBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      }
    }
    // Reposition crowd info panel relative to population crowd alignment
    this.repositionCrowdInfo();
  }

  private crowdAnchor() {
    const cam = this.scene.cameras.main;
    const planetSize = (this.scene as any).planetSizePx ?? 360;
    const baseOffsetX = 260; // keep in sync with PopulationVisuals.baseOffsetX
    const offsetX = planetSize / 2 + baseOffsetX * (planetSize / 400);
    const crowdSize = (this.scene as any).populationVisuals?.people?.length ?? 0;
    const outwardShift = Phaser.Math.Linear(0, 40, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
    const downwardShift = Phaser.Math.Linear(planetSize * 0.07, planetSize * 0.11, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
    const x = cam.width / 2 + offsetX + outwardShift;
    const y = cam.height / 2 + downwardShift;
    return { x, y };
  }

  private repositionCrowdInfo() {
    if (!this.crowdInfoBg || !this.crowdInfoText1 || !this.crowdInfoText2 || !this.crowdInfoText3) return;
    const { x, y } = this.crowdAnchor();
    const pad = 6;
    const w = 280;
    const lineH = 18;
    // We have 3 main lines plus 1 legend line
    const totalH = pad * 2 + lineH * 4;
    const bx = Math.min(Math.max(12, x - w / 2), this.scene.cameras.main.width - w - 12);
    // Raise higher above the crowd to avoid overlap
    const by = Math.max(this.headerHeight() + 56, y + 80);
    this.crowdInfoBg.setPosition(bx, by).clear().fillStyle(0x0b1220, 0.82).fillRoundedRect(0, 0, w, totalH, 8).lineStyle(1, 0x1f2937, 1).strokeRoundedRect(0, 0, w, totalH, 8);
    this.crowdInfoText1.setPosition(bx + pad, by + pad);
    // Position coin and shift the text2 line to the right of the coin
    const line2Y = by + pad + lineH;
    if (this.crowdInfoCoin) {
      this.crowdInfoCoin.setPosition(bx + pad, line2Y + Math.floor(lineH / 2)).setOrigin(0, 0.5);
      this.crowdInfoText2.setPosition(bx + pad + 20, line2Y);
    } else {
      this.crowdInfoText2.setPosition(bx + pad, line2Y);
    }
    this.crowdInfoText3.setPosition(bx + pad, by + pad + lineH * 2);
    if (this.crowdInfoLegend) this.crowdInfoLegend.setPosition(bx + pad + 12, by + pad + lineH * 3 - 2);
    if (this.crowdInfoDot) {
      // Slightly center the dot vertically with the legend text line
      const dy = by + pad + lineH * 3 + 5;
      this.crowdInfoDot.setPosition(bx + pad + 5, dy);
    }
  }

  public updateCrowdInfo(opts: { peopleCount: number; requiredPerSec: number; requiredPer10s?: number; incomePerSec: number; resources?: number; popCostPer10s: number; secondsUntilUpkeep: number }) {
    if (this.minimal) return;
    // Ensure elements exist
    if (!this.crowdInfoBg) this.crowdInfoBg = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_LABEL + 2).setScrollFactor(0);
    if (!this.crowdInfoText1) this.crowdInfoText1 = this.scene.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "12px", color: "#e5e7eb" }).setDepth(HudOverlay.DEPTH_LABEL + 3).setScrollFactor(0);
    if (!this.crowdInfoText2) this.crowdInfoText2 = this.scene.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "12px", color: "#e5e7eb" }).setDepth(HudOverlay.DEPTH_LABEL + 3).setScrollFactor(0);
    if (!this.crowdInfoText3) this.crowdInfoText3 = this.scene.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "11px", color: "#cbd5e1" }).setDepth(HudOverlay.DEPTH_LABEL + 3).setScrollFactor(0);
    if (!this.crowdInfoDot) this.crowdInfoDot = this.scene.add.graphics({ x: 0, y: 0 }).setDepth(HudOverlay.DEPTH_LABEL + 4).setScrollFactor(0);
    if (!this.crowdInfoLegend) this.crowdInfoLegend = this.scene.add.text(0, 0, "", { fontFamily: "monospace", fontSize: "11px", color: "#cbd5e1" }).setDepth(HudOverlay.DEPTH_LABEL + 4).setScrollFactor(0);
    if (!this.crowdInfoCoin) this.crowdInfoCoin = this.scene.add.image(0, 0, "coin").setDepth(HudOverlay.DEPTH_LABEL + 4).setScrollFactor(0).setScale(0.8).setOrigin(0, 0.5).setTint(0xfbbf24);

    // Line 1: concise requirement summary (only per-second shown)
    this.crowdInfoText1.setText(`👫 Resources need for ${opts.peopleCount} — (${opts.requiredPerSec.toFixed(0)})`);
    // Line 2: actual deduction amount per 10s with coin icon
    this.crowdInfoText2.setText(`Consumes 10s: -${Math.floor(opts.popCostPer10s)}`);
    // Line 3: timer to next deduction
    this.crowdInfoText3.setText(`Next: ${Math.max(0, Math.floor(opts.secondsUntilUpkeep))}s`);

    // Status dot + legend
    const green = 0x10b981; // increasing
    const grey = 0x9ca3af; // stable
    const red = 0xef4444; // decreasing
    let statusColor = grey;
    let statusLabel = "Stable";

    // Prefer explicit resources if provided, otherwise fall back to incomePerSec
    const available = (opts.resources !== undefined) ? opts.resources : opts.incomePerSec;
    // Decide status:
    // - If available is at least 20% more than requiredPerSec -> Increasing (green)
    // - If available is >= requiredPerSec but less than +20% -> Stable (grey)
    // - If available is less than requiredPerSec -> Decreasing (red)
    if (available >= opts.requiredPerSec * 1.2) {
      statusColor = green;
      statusLabel = "Increasing";
    } else if (available >= opts.requiredPerSec) {
      statusColor = grey;
      statusLabel = "Stable";
    } else {
      statusColor = red;
      statusLabel = "Decreasing";
    }

    this.crowdInfoDot.clear().fillStyle(statusColor, 1).fillCircle(0, 0, 5).lineStyle(1, 0x1f2937, 1).strokeCircle(0, 0, 5);
    this.crowdInfoLegend.setText(`Trend: ${statusLabel}`);

    this.repositionCrowdInfo();
  }

  // Clean up all created HUD elements safely
  public destroy() {
    const destroyObj = (o?: Phaser.GameObjects.GameObject) => {
      try {
        o && o.destroy();
      } catch { /* no-op */ }
    };
    destroyObj(this.topBar); this.topBar = undefined as any;
    destroyObj(this.topBarTitle); this.topBarTitle = undefined as any;
    destroyObj(this.topBarLegend); this.topBarLegend = undefined as any;
    destroyObj(this.scoreBoxBg); this.scoreBoxBg = undefined;
    destroyObj(this.scoreBoxText); this.scoreBoxText = undefined;
    destroyObj(this.planetBarBg); this.planetBarBg = undefined as any;
    destroyObj(this.planetBarFill); this.planetBarFill = undefined as any;
    destroyObj(this.populationBarBg); this.populationBarBg = undefined as any;
    destroyObj(this.populationBarFill); this.populationBarFill = undefined as any;
    destroyObj(this.planetLabel); this.planetLabel = undefined as any;
    destroyObj(this.populationLabel); this.populationLabel = undefined as any;
    destroyObj(this.hudText); this.hudText = undefined as any;
    destroyObj(this.healBtnBg); this.healBtnBg = undefined;
    destroyObj(this.healBtnText); this.healBtnText = undefined;
    destroyObj(this.installBarBg); this.installBarBg = undefined;
    destroyObj(this.installBarFill); this.installBarFill = undefined;
    destroyObj(this.installLabel); this.installLabel = undefined;
    destroyObj(this.musicBtnBg); this.musicBtnBg = undefined;
    destroyObj(this.musicBtnText); this.musicBtnText = undefined;
    destroyObj(this.crowdInfoBg); this.crowdInfoBg = undefined;
    destroyObj(this.crowdInfoText1); this.crowdInfoText1 = undefined;
    destroyObj(this.crowdInfoText2); this.crowdInfoText2 = undefined;
    destroyObj(this.crowdInfoText3); this.crowdInfoText3 = undefined;
    destroyObj(this.crowdInfoDot); this.crowdInfoDot = undefined;
    destroyObj(this.crowdInfoLegend); this.crowdInfoLegend = undefined;
    destroyObj(this.crowdInfoCoin); this.crowdInfoCoin = undefined;
  }

  // Expand a minimal HUD (intro) into full HUD without losing existing music button
  public expandToFull() {
    if (!this.minimal) return;
    this.minimal = false;
    this.createHudText();
    this.createHudBars();
    const cam = this.scene.cameras.main;
    this.redrawHeader(cam.width);
    this.forceVisibility();
  }
}

