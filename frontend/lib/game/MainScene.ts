import * as Phaser from "phaser";
import { gameConfig } from "@/data/gameConfig";
import type { GameState, InstalledSystem, GoodSystemKey, BadSystemKey } from "./types";
import { HudOverlay } from "./HudOverlay";
import { EconomySidebar } from "./EconomySidebar";

export default class MainScene extends Phaser.Scene {
  private state!: GameState;
  //eslint-disable-next-line
  private tickTimer?: Phaser.Time.TimerEvent;
  private planetSprite!: Phaser.GameObjects.Image;
  // Removed direct HUD/Sidebar fields; handled by modules
  private hud!: HudOverlay;
  private sidebar!: EconomySidebar;
  private replaceButtons: Phaser.GameObjects.DOMElement[] = [];
  private overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private overlayDom: Phaser.GameObjects.DOMElement[] = [];
  private bottomPanelDom: Phaser.GameObjects.DOMElement | null = null;
  private industryIcons: { image: Phaser.GameObjects.Image; angle: number; radius: number; key: BadSystemKey }[] = [];
  private tooltipDom: Phaser.GameObjects.DOMElement | null = null;
  private selectedBadKeyForReplacement: BadSystemKey | null = null;

  // Confetti particle texture guard
  private confettiReady: boolean = false;

  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.svg("planet", "/game/planet.svg", { width: 256, height: 256 });
    this.load.svg("planet_happy", "/game/planet_happy.svg", { width: 256, height: 256 });
    this.load.svg("planet_mid", "/game/planet_mid.svg", { width: 256, height: 256 });
    this.load.svg("planet_sick", "/game/planet_sick.svg", { width: 256, height: 256 });
    this.load.svg("oil", "/game/oil.svg", { width: 64, height: 64 });
    this.load.svg("coal", "/game/coal.svg", { width: 64, height: 64 });
    this.load.svg("logging", "/game/logging.svg", { width: 64, height: 64 });
    this.load.svg("solar", "/game/solar.svg", { width: 64, height: 64 });
    this.load.svg("wind", "/game/wind.svg", { width: 64, height: 64 });
    this.load.svg("reforest", "/game/reforest.svg", { width: 64, height: 64 });
    this.load.svg("sustainableFarm", "/game/farm.svg", { width: 64, height: 64 });
    this.load.svg("coin", "/game/coin.svg", { width: 20, height: 20 });
  }

  create() {
    this.initState();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.planetSprite = this.add.image(centerX, centerY, "planet_happy");
    // Subtle breathing animation for the planet
    this.tweens.add({ targets: this.planetSprite, scale: { from: 0.98, to: 1.02 }, duration: 2000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // Place initial industry icons around the planet
    const radius = 140;
    const positions = [0, 120, 240].map((deg) => Phaser.Math.DegToRad(deg));
    const initialKeys: Array<keyof typeof gameConfig.badSystems> = ["oil", "coal", "logging"];

    initialKeys.forEach((key, idx) => {
      const angle = positions[idx];
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const icon = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
      // Slight bob animation for icons
      this.tweens.add({ targets: icon, y: y - 4, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      // Subtle idle rotation
      this.tweens.add({ targets: icon, angle: { from: -3, to: 3 }, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      icon.setData("systemKey", key);
      // Click to replace
      icon.on("pointerdown", () => this.promptReplacement(key));

      // Hover tooltip
      icon.on("pointerover", (pointer: Phaser.Input.Pointer) => this.showTooltipForBad(key as BadSystemKey, pointer.x, pointer.y));
      icon.on("pointermove", (pointer: Phaser.Input.Pointer) => this.moveTooltip(pointer.x, pointer.y));
      icon.on("pointerout", () => this.hideTooltip());

      this.industryIcons.push({ image: icon, angle, radius, key: key as BadSystemKey });
    });

    // HUD & Sidebar modules
    this.hud = new HudOverlay(this);
    this.hud.createHeader();
    this.hud.createHudText();
    this.hud.createHudBars();
    this.sidebar = new EconomySidebar(this, () => this.hud.headerHeight());

    this.updateHud();
    this.showStartOverlay();

    // Handle resize events to keep elements anchored
    this.scale.on("resize", this.handleResize, this);
  }

  private initState() {
    const bad = gameConfig.badSystems;
    const installed: InstalledSystem[] = [bad.oil, bad.coal, bad.logging].map((s) => ({
      key: s.key,
      type: "bad",
      resourceIncome: s.resourceIncome,
      planetImpact: s.planetImpact,
      spriteKey: s.key
    }));

    this.state = {
      tick: 0,
      planetHealth: gameConfig.planet.start,
      populationHealth: gameConfig.population.start,
      resources: gameConfig.resourcesStart,
      installed,
      installing: null,
      gameOver: false
    };
  }

  private startTickLoop() {
    this.tickTimer = this.time.addEvent({
      delay: gameConfig.tickDurationMs,
      loop: true,
      callback: () => this.onTick()
    });
  }

  private showStartOverlay() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    const bg = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.6).setInteractive();

    const panelWidth = Math.min(840, cam.width - 40);
    const panelMaxHeight = Math.min(460, cam.height - 120);
    const html = `
      <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:#111827cc;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;padding:16px;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;">
          <div style="font-weight:800;font-size:22px;">Save a Planet — MVP</div>
        </div>
        <div style="font-size:14px;opacity:.9;line-height:1.45;margin-bottom:12px;">
          Balance resources and environment. Replace polluting industries with cleaner solutions while keeping people healthy.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px;">
          <div style="background:#0b1220; border:1px solid #1f2937; border-radius:8px; padding:10px;">
            <div style="font-weight:700;margin-bottom:6px;">Stats</div>
            <ul style="margin:0;padding-left:16px;opacity:.9;">
              <li><b>Planet</b>: Changes each second from base decay + total impact. Good systems <i>heal</i> (negative impact).</li>
              <li><b>Population</b>: Drops if resources go negative or planet is stressed.</li>
              <li><b>Resources</b>: Earned from systems; pay population upkeep periodically.</li>
              <li><b>Income</b>: Sum of resource income per second.</li>
              <li><b>Impact</b>: Planet change per second; positive = damage, negative = healing.</li>
            </ul>
          </div>
          <div style="background:#0b1220; border:1px solid #1f2937; border-radius:8px; padding:10px;">
            <div style="font-weight:700;margin-bottom:6px;">How to play</div>
            <ul style="margin:0;padding-left:16px;opacity:.9;">
              <li>Click a polluting icon near the planet.</li>
              <li>Choose a clean solution. You pay <b>replace cost</b> + <b>build cost</b>.</li>
              <li>Installation takes a short time (seconds); income/impact updates when done.</li>
              <li>Keep <b>Planet</b> and <b>Population</b> above 0 to survive.</li>
              <li>Tip: Balance income to avoid going negative while healing the planet.</li>
            </ul>
          </div>
        </div>
        <div style="display:flex;justify-content:center;margin-top:6px;">
          <button data-start style="padding:10px 14px;background:#10b981;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Start Game</button>
        </div>
      </div>`;

    const dom = this.add.dom(cx, cy).createFromHTML(html).setOrigin(0.5, 0.5);
    dom.addListener("click");
    dom.on("click", (ev: any) => {
      const t = ev.target as HTMLElement;
      if (t && t.getAttribute("data-start") !== null) this.startGame();
    });

    this.overlayObjects.push(bg);
    this.overlayDom.push(dom);
  }

  private startGame() {
    // Destroy overlay and begin ticking
    this.overlayObjects.forEach((o) => o.destroy());
    this.overlayDom.forEach((d) => d.destroy());
    this.overlayObjects = [];
    this.overlayDom = [];
    this.startTickLoop();
  }

  private onTick() {
    if (this.state.gameOver) return;

    this.state.tick += 1;

    // 1) Planet decay
    const totalImpact = this.state.installed.reduce((sum, s) => sum + s.planetImpact, 0);
    const planetDecay = gameConfig.baseDecay + totalImpact;
    const prevPlanet = this.state.planetHealth;
    this.state.planetHealth -= planetDecay;

    // 2) Resources (never decrease): add positive net; if net < 0, don't reduce resources
    const income = this.state.installed.reduce((sum, s) => sum + s.resourceIncome, 0);
    const net = income - gameConfig.population.upkeep;
    if (net >= 0) {
      this.state.resources += net;
    }

    // 3) Underfund penalty when net negative
    if (net < 0) {
      this.state.populationHealth -= gameConfig.underfundPenalty;
    }

    // 4) Planet stress penalty
    const stressThreshold = gameConfig.planet.max * gameConfig.planetStressThresholdPct;
    if (this.state.planetHealth < stressThreshold) {
      this.state.populationHealth -= gameConfig.planetStressPenalty;
    }

    // 5) Installing countdown
    if (this.state.installing) {
      this.state.installing.remainingTicks -= 1;
      if (this.state.installing.remainingTicks <= 0) {
        const good = gameConfig.goodSystems[this.state.installing.key];
        this.state.installed.push({
          key: good.key,
          type: "good",
          resourceIncome: good.resourceIncome,
          planetImpact: good.planetImpact,
          spriteKey: good.key
        });
        // Optionally remove one bad system if a specific target was selected
        if (this.selectedBadKeyForReplacement) {
          const idx = this.state.installed.findIndex(
            (s) => s.type === "bad" && s.key === this.selectedBadKeyForReplacement
          );
          if (idx !== -1) this.state.installed.splice(idx, 1);
          this.selectedBadKeyForReplacement = null;
        }
        this.state.installing = null;
        this.addFloatingText("Installation complete!", { color: "#9be37f" });
        this.hideInstallUi();
        this.emitConfetti();
      }
    }

    // Clamp values and check game over
    this.state.planetHealth = Math.max(0, Math.min(gameConfig.planet.max, this.state.planetHealth));
    this.state.populationHealth = Math.max(0, Math.min(gameConfig.population.max, this.state.populationHealth));

    if (this.state.planetHealth <= 0 || this.state.populationHealth <= 0) {
      this.state.gameOver = true;
      this.addFloatingText("Game Over", { color: "#ff6666" });
      this.time.delayedCall(100, () => this.showGameOver());
    }

    this.updateHud();
    this.updatePlanetAppearance();
    this.flashPlanet(prevPlanet);
    this.updateSidebar();
    // ensure install progress bar updates while installing
    this.updateInstallUi();
  }

  private showGameOver() {
    const { tick, planetHealth, populationHealth } = this.state;
    const seconds = tick * (gameConfig.tickDurationMs / 1000);
    const score = Math.floor((seconds / 10) * 1 + planetHealth / 100 + populationHealth);

    const g = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      420,
      200,
      0x000000,
      0.7
    );
    const t = this.add.text(
      g.x - 180,
      g.y - 70,
      `Game Over\nTime: ${seconds.toFixed(1)}s\nScore: ${score}\nClick to restart`,
      {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff"
      }
    );
    g.setInteractive().once("pointerdown", () => this.scene.restart());
    t.setInteractive().once("pointerdown", () => this.scene.restart());
  }

  private addFloatingText(text: string, style?: { color?: string }) {
    const x = this.cameras.main.width / 2;
    const y = 40;
    const txt = this.add.text(x, y, text, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: style?.color ?? "#ffffff"
    });
    txt.setOrigin(0.5, 0);
    this.tweens.add({ targets: txt, y: y - 20, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  private updateHud() {
    const { planetHealth, populationHealth, resources, installed, installing } = this.state;
    const tickSec = gameConfig.tickDurationMs / 1000;
    const totalImpactPerTick = installed.reduce((s, i) => s + i.planetImpact, 0);
    const incomePerTick = installed.reduce((s, i) => s + i.resourceIncome, 0);
    const incomePerSec = incomePerTick / tickSec;
    const planetDeltaPerSec = (gameConfig.baseDecay + totalImpactPerTick) / tickSec; // >0 damage, <0 heal
    const installLabel = installing
      ? `  Installing ${gameConfig.goodSystems[installing.key].name} (${Math.ceil(installing.remainingTicks * tickSec)}s)`
      : "";
    const planetDeltaLabel = planetDeltaPerSec > 0
      ? `Damage ${planetDeltaPerSec.toFixed(1)}/s`
      : `Heal ${Math.abs(planetDeltaPerSec).toFixed(1)}/s`;
    const seconds = this.state.tick * tickSec;
    const score = Math.floor((seconds / 10) * 1 + planetHealth / 100 + populationHealth);

    this.hud.setHudText(
      `🌍 Planet: ${planetHealth.toFixed(0)}/${gameConfig.planet.max}  ` +
      `👥 Population: ${populationHealth.toFixed(0)}/${gameConfig.population.max}  ` +
      `🪙 Resources: ${resources.toFixed(0)}  ` +
      `⬆️ Income: +${incomePerSec.toFixed(1)}/s  ` +
      `⚖️ ${planetDeltaLabel}  ` +
      `🏆 Score: ${score}` +
      installLabel
    );

    this.hud.redrawBars(
      planetHealth / gameConfig.planet.max,
      populationHealth / gameConfig.population.max
    );
  }

  private showInstallUi(systemName: string, totalTicks: number) {
    this.hud.showInstallUi(systemName, totalTicks);
  }

  private updateInstallUi() {
    const remaining = this.state.installing ? this.state.installing.remainingTicks : null;
    this.hud.updateInstallProgress(remaining);
  }

  private hideInstallUi() {
    this.hud.hideInstallUi();
  }

  private ensureSidebar() {
    if (!this.sidebar) this.sidebar = new EconomySidebar(this, () => this.hud.headerHeight());
    this.sidebar.ensure();
  }

  private updateSidebar() {
    this.ensureSidebar();
    this.sidebar.update(this.state.installed);
  }

  // ----- Replacement UI -----
  private promptReplacement(badKey: BadSystemKey) {
    // If already installing, prevent concurrent installs
    if (this.state.installing) {
      this.addFloatingText("Installation already in progress", { color: "#fbbf24" });
      return;
    }
    // Close existing panel if any
    this.closeBottomPanel();

    const cam = this.cameras.main;
    const width = cam.width;
    const height = cam.height;
    const panelWidth = Math.min(860, width - 24);
    const panelMaxHeight = Math.max(180, Math.floor(height * 0.46));
    const x = (width - panelWidth) / 2;
    const y = height - panelMaxHeight - 14;

    const bad = gameConfig.badSystems[badKey];
    const goods = Object.values(gameConfig.goodSystems);
    const tickSec = gameConfig.tickDurationMs / 1000;

    const cards = goods
      .map((g) => {
        const totalCost = bad.replaceCost + g.buildCost;
        return `
        <div style="background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:12px;display:flex;gap:12px;align-items:center;">
          <div style="width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;background:#0f172a;border-radius:8px;border:1px solid #1f2937;">⚙️</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;">${g.name}</div>
            <div style="opacity:.85;font-size:12px;margin:4px 0 6px;">${g.blurb}</div>
            <div style="display:flex;gap:12px;font-size:12px;opacity:.9;">
              <span>Build: ${g.buildCost}</span>
              <span>Replace: ${bad.replaceCost}</span>
              <span>Total: <b>${totalCost}</b></span>
              <span>Time: ${Math.ceil(g.installTimeTicks * tickSec)}s</span>
              <span>Income: +${(g.resourceIncome / tickSec).toFixed(1)}/s</span>
              <span>${g.planetImpact > 0 ? "Damage" : "Heal"}: ${Math.abs(g.planetImpact / tickSec).toFixed(1)}/s</span>
            </div>
          </div>
          <button data-pick="${g.key}" style="padding:8px 10px;background:#10b981;color:#0b1220;border:none;border-radius:8px;font-weight:700;">Replace</button>
        </div>`;
      })
      .join("");

    const html = `
      <div style="width:${panelWidth}px;max-height:${panelMaxHeight}px;overflow:auto;background:#0b1220ee;border:1px solid #1f2937;border-radius:12px;color:#e5e7eb;padding:14px;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.45)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-weight:800;font-size:18px;">Replace ${bad.name}</div>
          <button data-close style="background:#1f2937;color:#e5e7eb;border:none;border-radius:8px;padding:6px 10px;">Close</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:10px;">${cards}</div>
      </div>`;

    const dom = this.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(25);
    dom.addListener("click");
    dom.on("click", (ev: any) => {
      const t = ev.target as HTMLElement;
      if (!t) return;
      if (t.getAttribute("data-close") !== null) {
        this.closeBottomPanel();
        return;
      }
      const pick = t.getAttribute("data-pick");
      if (pick) {
        const goodKey = pick as GoodSystemKey;
        const good = gameConfig.goodSystems[goodKey];
        const totalCost = bad.replaceCost + good.buildCost;
        if (this.state.resources < totalCost) {
          this.addFloatingText("Not enough resources", { color: "#f87171" });
          return;
        }
        // Deduct and begin installing
        this.state.resources -= totalCost;
        this.state.installing = { key: goodKey, remainingTicks: good.installTimeTicks };
        this.selectedBadKeyForReplacement = badKey;
        this.showInstallUi(good.name, good.installTimeTicks);
        this.updateHud();
        this.closeBottomPanel();
        this.addFloatingText(`Installing ${good.name}...`, { color: "#9be37f" });
      }
    });

    this.bottomPanelDom = dom;
  }

  private closeBottomPanel() {
    if (this.bottomPanelDom) {
      this.bottomPanelDom.destroy();
      this.bottomPanelDom = null;
    }
  }

  private showTooltipForBad(key: BadSystemKey, px: number, py: number) {
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
    if (this.tooltipDom) this.tooltipDom.destroy();
    const dom = this.add.dom(0, 0).createFromHTML(html).setDepth(30);
    this.tooltipDom = dom;
    this.moveTooltip(px, py);
  }

  private moveTooltip(px: number, py: number) {
    if (!this.tooltipDom) return;
    const cam = this.cameras.main;
    const pad = 10;
    const approxW = 220;
    const approxH = 90;
    let x = px + pad;
    let y = py + pad;
    if (x + approxW > cam.width) x = px - approxW - pad;
    if (y + approxH > cam.height) y = py - approxH - pad;
    this.tooltipDom.setPosition(x, y);
  }

  private hideTooltip() {
    if (this.tooltipDom) {
      this.tooltipDom.destroy();
      this.tooltipDom = null;
    }
  }

  // ----- Resize handling -----
  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;
    const cx = width / 2;
    const cy = height / 2;

    // Recenter planet
    if (this.planetSprite) {
      this.planetSprite.setPosition(cx, cy);
    }

    // Reposition industry icons around planet
    this.industryIcons.forEach(({ image, angle, radius }) => {
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      image.setPosition(x, y);
    });

    // Reposition bottom panel if open
    if (this.bottomPanelDom) {
      const panelWidth = Math.min(820, width - 24);
      const panelMaxHeight = Math.max(170, Math.floor(height * 0.45));
      const x = (width - panelWidth) / 2;
      const y = height - panelMaxHeight - 16;
      this.bottomPanelDom.setPosition(x, y);
      // Also update the DOM root styles to reflect new bounds
      const root = this.bottomPanelDom.node as HTMLElement;
      if (root) {
        root.style.width = `${panelWidth}px`;
        root.style.maxHeight = `${panelMaxHeight}px`;
      }
    }

    // Keep tooltip within bounds
    if (this.tooltipDom) {
      const p = this.tooltipDom;
      const x = Math.min(p.x, width - 240);
      const y = Math.min(p.y, height - 120);
      p.setPosition(x, y);
    }

    // Redraw bars to ensure correct widths after resize
    this.updateHud();

    // Reposition sidebar and header/install UI
    if (this.sidebar) this.sidebar.reposition(width, height);
    if (this.hud) this.hud.reposition(width);
  }

  // ----- Visual polish helpers -----
  private updatePlanetAppearance() {
    const p = this.state.planetHealth;
    // Switch sprite by thresholds
    const max = gameConfig.planet.max;
    const happyCut = max * 0.7;
    const midCut = max * 0.35;
    let key = "planet_happy";
    if (p < midCut) key = "planet_sick";
    else if (p < happyCut) key = "planet_mid";
    if (this.planetSprite.texture.key !== key) {
      this.planetSprite.setTexture(key);
    }
  }

  private flashPlanet(prevPlanet: number) {
    const delta = this.state.planetHealth - prevPlanet;
    if (!delta) return;
    const tint = delta < 0 ? 0xff6666 : 0x9be37f;
    const sprite = this.planetSprite;
    sprite.setTint(tint);
    this.tweens.add({
      targets: sprite,
      scale: { from: 1.02, to: 1 },
      duration: 220,
      onComplete: () => sprite.clearTint()
    });
  }

  private emitConfetti() {
    if (!this.confettiReady) {
      const g = this.add.graphics({ x: 0, y: 0 });
      g.setVisible(false);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 4, 4);
      g.generateTexture("confetti", 4, 4);
      g.destroy();
      this.confettiReady = true;
    }
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const pm = this.add.particles(0, 0, "confetti", {
      x: cx,
      y: cy,
      speed: { min: -280, max: 280 },
      angle: { min: 0, max: 360 },
      gravityY: 450,
      lifespan: 900,
      quantity: 80,
      scale: { start: 1, end: 0 },
      blendMode: "ADD"
    });
    this.time.delayedCall(1100, () => pm.destroy());
  }
}
