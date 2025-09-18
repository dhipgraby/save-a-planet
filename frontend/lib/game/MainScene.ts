import * as Phaser from "phaser";
// Lightweight local interface so file compiles before population module is picked up.
// Will be satisfied by runtime object returned from require('./population/PopulationVisuals').
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
import { gameConfig } from "@/data/gameConfig";
import type { GameState, InstalledSystem, GoodSystemKey, BadSystemKey } from "./types";
import { HudOverlay } from "./HudOverlay";
import { EconomySidebar } from "./EconomySidebar";
import { StatsSidebar } from "./StatsSidebar";
import { StartMenu } from "./ui/menus/startMenu";
import { IntroSequence } from "./ui/intro/introSequence";
import { spawnFloatingText } from "./ui/effects/floatingText";
import { showTooltipForBad } from "./ui/tooltips/systemTooltips";
import { updateBottomToolbar } from "./ui/toolbar/bottomToolbar";
import { showGameOverScreen } from "./ui/menus/gameOverScreen";
import { addGoodIcon as addGoodIconUtil, promptSell as promptSellUtil } from "./ui/systems/goodSystems";
import { promptReplacement as promptReplacementUtil } from "./ui/systems/badSystems";
import { PopulationVisuals } from "./population/PopulationVisuals";
export default class MainScene extends Phaser.Scene {
  private state!: GameState;
  private planetBase!: Phaser.GameObjects.Image;
  // Overlay animation now uses two layers for smooth cross-fade
  private planetOverlayA!: Phaser.GameObjects.Image; // first overlay layer
  private planetOverlayB!: Phaser.GameObjects.Image; // second overlay layer
  private planetOverlayActive!: Phaser.GameObjects.Image; // pointer to currently visible layer
  private planetOverlayFrame: number = 0; // current frame index (0..27)
  private planetOverlayTimer?: Phaser.Time.TimerEvent; // frame update timer
  // Base overlay opacity (will be dynamically scaled by planet health)
  private planetOverlayOpacity: number = 0.15; // min opacity at full health
  private planetOverlayOpacityMax: number = 0.85; // max opacity at 0 health (more visible damage)
  private planetOverlayCurrentOpacity: number = 0.15; // cached current target computed from health
  private planetOverlayFadeMs: number = 3000; // very slow fade duration for smooth overlap
  private planetOverlayFrameIntervalMs: number = 2200; // start next frame before previous fade finishes (overlap)
  private planetClouds?: Phaser.GameObjects.Image; // faint secondary cloud layer
  private planetCloudsBaseAlpha: number = 0.08; // subtle base alpha
  private planetCloudsDamageBoostAlpha: number = 0.18; // extra alpha when planet heavily damaged
  // Breathing configuration (drift disabled per user preference)
  // Breathing fully disabled (kept fields commented for quick restore)
  // private driftTime: number = 0;
  // private breatheAmp: number = 0.03;
  // private breatheSpeed: number = 0.06;
  private planetCloudsBaseScale: number = 1; // captured base scale for clouds
  private perlinPerm: number[] = []; // retained (noise disabled for position)
  private planetDom: Phaser.GameObjects.DOMElement | null = null; // deprecated (kept for fallback)
  private planetSizePx: number = 260;
  // Base planet center for sprite (used to stabilize frame-based offsets)
  private planetBaseX: number = 0;
  private planetBaseY: number = 0;
  // Per-frame Y offsets (tweakable to remove vertical jitter). 8 frames -> initialize zeros.
  private planetFrameYOffsets: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  // Removed direct HUD/Sidebar fields; handled by modules
  private hud!: HudOverlay;
  private sidebar!: EconomySidebar;
  private statsSidebar!: StatsSidebar;
  private overlayObjects: Phaser.GameObjects.GameObject[] = [];
  private overlayDom: Phaser.GameObjects.DOMElement[] = [];
  private tickTimer?: Phaser.Time.TimerEvent;
  private bottomPanelDom: Phaser.GameObjects.DOMElement | null = null;
  private bottomToolbarDom: Phaser.GameObjects.DOMElement | null = null;
  private startMenu?: StartMenu; // extracted start menu module
  // track whether the current bottom panel should be centered vertically
  private bottomPanelCentered: boolean = false;
  private industryIcons: { image: Phaser.GameObjects.Image; angle: number; radius: number; key: string; type: "bad" | "good" }[] = [];
  private tooltipDom: Phaser.GameObjects.DOMElement | null = null;
  private starsBackdropDom: Phaser.GameObjects.DOMElement | null = null; // deprecated
  // Intro / start flow DOM refs
  private introDom: Phaser.GameObjects.DOMElement | null = null;
  private introSequence?: IntroSequence; // extracted intro sequence manager
  private introActive: boolean = false;

  // Confetti particle texture guard
  private confettiReady: boolean = false;

  constructor() {
    super("MainScene");
    // (Noise table creation left intact if future subtle drift needed)
    const p: number[] = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));[p[i], p[j]] = [p[j], p[i]];
    }
    this.perlinPerm = p.concat(p);
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
    // Layered planet assets
    this.load.image("planet_base_hd", "/game/sprites/base-planet.png"); // 1280x1280
    for (let i = 0; i < 28; i++) {
      const n = i.toString().padStart(2, "0");
      this.load.image(`planet_noise_${n}`, `/game/sprites/planet-parts/noise${n}.png`); // 1024x1024
    }
    // People (population) sprite sheets – loading individual frames (walk1/walk2 + stand) per color
    const colors = ["Beige", "Blue", "Green", "Pink", "Yellow"]; // matches filenames alien<Color>_walk1.png etc.
    colors.forEach(c => {
      this.load.image(`alien${c}_stand`, `/game/sprites/people/alien${c}_stand.png`);
      this.load.image(`alien${c}_walk1`, `/game/sprites/people/alien${c}_walk1.png`);
      this.load.image(`alien${c}_walk2`, `/game/sprites/people/alien${c}_walk2.png`);
      // optional extra frames (jump/swim) could be added later
    });
  }

  create() {
    this.initState();
    // Launch educational intro first
    this.startIntroSequence();
    // Handle resize events to keep elements anchored (safe pre-world)
    this.scale.on("resize", this.handleResize, this);
    // Dev shortcut: press B to surrender / trigger game over screen
    this.input.keyboard?.on("keydown-B", () => this.forceGameOver());

    // Ensure cleanup on scene shutdown (e.g., restart) to prevent update calls on destroyed textures
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.populationVisuals && typeof this.populationVisuals.destroy === "function") {
        try {
          this.populationVisuals.destroy();
        } catch { /* ignore */ }
      }
      this.populationVisuals = undefined;
    });
  }

  private initWorld() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Build planet (now only rotating base image)
    this.createLayeredPlanet(centerX, centerY);
    // Floating industry icons removed; interaction now through bottom toolbar buttons with tooltips.

    // HUD (create first so sidebars can safely reference headerHeight)
    this.ensureHud();
    // Sidebars (guard headerHeight reference if HUD was somehow not created)
    const headerHeightFn = () => (this.hud ? this.hud.headerHeight() : 56);
    this.sidebar = new EconomySidebar(this, headerHeightFn);
    this.statsSidebar = new StatsSidebar(this, headerHeightFn);
    this.statsSidebar.ensure(this.state.populationHealth);
    // Place economy under stats with a small gap
    const econTop = this.statsSidebar.bottomY() + 12;
    this.sidebar.ensure(econTop);

    // Heal button
    this.hud.createHealButton(() => this.tryHeal());

    // Bottom toolbar (installed systems + buy)
    this.updateBottomToolbar();

    this.updateHud();
    this.applyPlanetHealthVisuals();

    // Initialize population visuals on first world build
    this.ensurePopulationVisuals();
  }

  private ensureHud() {
    if (this.hud) return;
    this.hud = new HudOverlay(this);
    this.hud.createHeader();
    this.hud.createHudText();
    this.hud.createHudBars();
  }

  // ----- Population Visuals Integration -----
  private populationVisuals?: PopulationVisuals; // set after first ensurePopulationVisuals()
  private ensurePopulationVisuals() {
    if (!this.populationVisuals) {
      // const { PopulationVisuals } = require("./population/PopulationVisuals");
      this.populationVisuals = new PopulationVisuals(this, () => this.state.populationHealth, () => this.planetSizePx);
    }
    this.populationVisuals!.sync();
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
      lastConsumptionTick: 0,
      lastHealTick: 0,
      healCooldownUntilTick: 0,
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
    // Use extracted StartMenu component
    this.startMenu = new StartMenu(this, { onStart: () => this.startGame() });
    this.startMenu.show();
  }

  private startGame() {
    // Hide start menu if present
    this.startMenu?.hide();
    // Destroy overlay and begin ticking
    this.overlayObjects.forEach((o) => o.destroy());
    this.overlayDom.forEach((d) => d.destroy());
    this.overlayObjects = [];
    this.overlayDom = [];
    if (this.introDom) {
      this.introDom.destroy(); this.introDom = null;
    }
    this.introActive = false;

    // Build the world and UI now
    this.initWorld();
    // Reset toolbar DOM ref to force clean rebuild on first updateBottomToolbar after restart
    this.bottomToolbarDom = null;
    this.startTickLoop();

    // Make sure all UI elements are visible and properly positioned
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Delay slightly to ensure DOM elements are fully created
    this.time.delayedCall(50, () => {
      // Force visibility & reposition only (avoid recreating which caused overlap)
      if (this.hud) {
        this.hud.reposition(width);
        this.hud.forceVisibility();
      }

      // Reposition industry icons to ensure visibility
      const centerX = width / 2;
      const centerY = height / 2;
      const dynamicRadius = Math.round(this.planetSizePx / 2) + 50;
      this.industryIcons.forEach(({ image, angle }) => {
        const x = centerX + dynamicRadius * Math.cos(angle);
        const y = centerY + dynamicRadius * Math.sin(angle);
        image.setPosition(x, y);
        image.setVisible(true);
      });

      // Apply full resize to ensure everything is positioned correctly
      this.handleResize({ width, height } as Phaser.Structs.Size);

      // Ensure all UI elements are updated
      this.updateHud();
      this.updateSidebar();
      this.updateBottomToolbar();

      // Apply planet visuals
      this.applyPlanetHealthVisuals();
    });
  }

  // Intro sequence now delegated to IntroSequence module
  private startIntroSequence() {
    if (this.introSequence?.isActive()) return;
    this.introSequence = new IntroSequence(this, {
      onComplete: () => {
        this.showStartOverlay();
      },
      onSkipToEnd: () => { /* optional hook for analytics */ }
    });
    this.introSequence.start();
  }

  private onTick() {
    if (this.state.gameOver) return;

    this.state.tick += 1;

    // 1) Planet damage per second
    const totalImpact = this.state.installed.reduce((sum, s) => sum + s.planetImpact, 0);
    const planetDecay = gameConfig.baseDecay + totalImpact; // positive = damage per second
    this.state.planetHealth -= planetDecay;

    // 2) Resources income per second
    const incomePerSec = this.state.installed.reduce((sum, s) => sum + s.resourceIncome, 0);
    this.state.resources += incomePerSec;

    // 3) Every 10s: deduct required resources from bank (survival consumption)
    if (this.state.tick - this.state.lastConsumptionTick >= 10) {
      // Deduct actual consumption per 10s (small amount) based on population
      const required = this.state.populationHealth * gameConfig.populationConsumptionPer10sPerCapita;
      const deducted = Math.min(this.state.resources, required);
      this.state.resources -= deducted;
      if (deducted > 0) spawnFloatingText(this, `Population consumption -${Math.floor(deducted)} resources`, { color: "#fbbf24", y: this.hud ? this.hud.headerHeight() + 8 : 40 });
      this.state.lastConsumptionTick = this.state.tick;
    }

    // 4) Every 5s: population decay/heal based on income sufficiency
    if (this.state.tick - this.state.lastHealTick >= gameConfig.populationCheckIntervalSec) {
      // Required income per second based on minimum per population point: (pop * minPer10s) / 10
      const requiredPerSec = (this.state.populationHealth * gameConfig.minIncomePerPopPer10s) / 10;
      if (this.state.resources >= requiredPerSec * gameConfig.populationHealThresholdMultiplier) {
        // Heal if we have 40% more than required
        this.state.populationHealth += gameConfig.populationHealPerCheck;
        // Show growth text above population crowd instead of header
        if (this.populationVisuals) {
          const cam = this.cameras.main;
          const planetSize = this.planetSizePx;
          // Recompute crowd anchor similar to PopulationVisuals.layout logic
          const baseOffsetX = 260;
          const offsetX = planetSize / 2 + baseOffsetX * (planetSize / 400);
          // Estimate downward shift logic (mirrors PopulationVisuals adjustments partially)
          const crowdSize = (this.populationVisuals as any).people ? (this.populationVisuals as any).people.length : 0;
          const outwardShift = Phaser.Math.Linear(0, 40, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
          const downwardShift = Phaser.Math.Linear(planetSize * 0.07, planetSize * 0.11, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
          const cx = cam.width / 2 + offsetX + outwardShift;
          const cy = cam.height / 2 + downwardShift;
          spawnFloatingText(this, `Population +${gameConfig.populationHealPerCheck}`, { color: "#86efac", x: cx, y: cy - 160 });
        } else {
          spawnFloatingText(this, `Population +${gameConfig.populationHealPerCheck}`, { color: "#86efac", y: this.hud ? this.hud.headerHeight() + 28 : 40 });
        }
      } else if (this.state.resources < requiredPerSec) {
        // Decay if we have less than required
        this.state.populationHealth -= gameConfig.populationDecayPerCheck;
        // Show decay text above the population crowd (mirrors growth positioning)
        if (this.populationVisuals) {
          const cam = this.cameras.main;
          const planetSize = this.planetSizePx;
          const baseOffsetX = 260;
          const offsetX = planetSize / 2 + baseOffsetX * (planetSize / 400);
          const crowdSize = (this.populationVisuals as any).people ? (this.populationVisuals as any).people.length : 0;
          const outwardShift = Phaser.Math.Linear(0, 40, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
          const downwardShift = Phaser.Math.Linear(planetSize * 0.07, planetSize * 0.11, Phaser.Math.Clamp(crowdSize / 500, 0, 1));
          const cx = cam.width / 2 + offsetX + outwardShift;
          const cy = cam.height / 2 + downwardShift;
          spawnFloatingText(this, `Underfunded! Population -${gameConfig.populationDecayPerCheck}`, { color: "#f87171", x: cx, y: cy - 160 });
        } else {
          spawnFloatingText(this, `Underfunded! Population -${gameConfig.populationDecayPerCheck}`, { color: "#f87171", y: this.hud ? this.hud.headerHeight() + 8 : 40 });
        }
      }
      this.state.lastHealTick = this.state.tick;
    }

    // 5) Planet stress penalty (applies per second under threshold)
    const stressThreshold = gameConfig.planet.max * gameConfig.planetStressThresholdPct;
    if (this.state.planetHealth < stressThreshold) {
      this.state.populationHealth -= gameConfig.planetStressPenalty;
    }

    // Clamp values and check game over
    this.state.planetHealth = Math.max(0, Math.min(gameConfig.planet.max, this.state.planetHealth));
    this.state.populationHealth = Math.max(0, Math.min(gameConfig.population.max, this.state.populationHealth));

    if (this.state.planetHealth <= 0 || this.state.populationHealth <= 0) {
      this.state.gameOver = true;
      // Stop ticking immediately to prevent late HUD updates against destroyed objects
      if (this.tickTimer) {
        this.tickTimer.remove(false); this.tickTimer = undefined;
      }
      spawnFloatingText(this, "Game Over", { color: "#ff6666", y: this.hud ? this.hud.headerHeight() + 8 : 40 });
      this.time.delayedCall(100, () => this.showGameOver());
    }

    this.updateHud();
    this.applyPlanetHealthVisuals();
    this.updateSidebar();

    // Update left stats sidebar
    // Consumption (10s) is the small amount actually deducted
    const popCostPer10s = this.state.populationHealth * gameConfig.populationConsumptionPer10sPerCapita;
    // Required income per second to avoid decay is larger: (pop * min per 10s) / 10
    const requiredPerSec = (this.state.populationHealth * gameConfig.minIncomePerPopPer10s) / 10;
    const secondsUntilUpkeep = Math.max(0, this.state.lastConsumptionTick + 10 - this.state.tick);
    if (this.statsSidebar) {
      this.statsSidebar.update({
        resources: this.state.resources,
        incomePerSec,
        popCostPer10s,
        requiredPerSec,
        secondsUntilUpkeep,
        populationHealth: this.state.populationHealth
      });
    }

    // Update heal cooldown display
    const secondsLeft = Math.max(0, Math.ceil(this.state.healCooldownUntilTick - this.state.tick));
    this.hud.updateHealButtonCooldown(secondsLeft);
    // Refresh bottom toolbar (reflect new income/installed changes)
    this.updateBottomToolbar();

    // Sync population visuals with new populationHealth (every tick fine – internal diffing cheap)
    if (this.populationVisuals) this.populationVisuals.sync();
  }

  private showGameOver() {
    // Fade out everything except the planet (and its overlays) before showing screen
    const fadeDuration = 800;
    const keep: Set<Phaser.GameObjects.GameObject> = new Set();
    if (this.planetBase) keep.add(this.planetBase);
    if (this.planetOverlayA) keep.add(this.planetOverlayA);
    if (this.planetOverlayB) keep.add(this.planetOverlayB);
    if (this.planetClouds) keep.add(this.planetClouds);

    this.children.each(obj => {
      if (keep.has(obj)) return;
      // Ignore game over elements added later (depth check > 350 used in gameOverScreen)
      this.tweens.add({ targets: obj, alpha: 0, duration: fadeDuration, ease: "Sine.easeIn" });
    });

    this.time.delayedCall(fadeDuration + 20, () => {
      showGameOverScreen(this, {
        tick: this.state.tick,
        planetHealth: this.state.planetHealth,
        populationHealth: this.state.populationHealth,
        installed: this.state.installed.map(s => ({ type: s.type, key: s.key }))
      }, () => {
        // Clean up population visuals explicitly to avoid texture swaps after restart
        if (this.populationVisuals && typeof this.populationVisuals.destroy === "function") {
          try {
            this.populationVisuals.destroy();
          } catch { /* no-op */ }
        }
        this.populationVisuals = undefined; // allow fresh creation in new scene instance
        // Explicitly drop HUD reference so any async calls bail
        this.hud = undefined as any;
        this.scene.restart();
      });
    });
  }

  // Force game over (developer / surrender). Sets flag and invokes UI.
  public forceGameOver() {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.showGameOver();
  }

  // Floating text helper moved to ui/effects/floatingText.ts (spawnFloatingText)

  private updateHud() {
    // Do not update HUD after game over (elements may be faded or destroyed)
    if (this.state?.gameOver) return;
    const { planetHealth, populationHealth, installed } = this.state;
    const tickSec = gameConfig.tickDurationMs / 1000;
    const totalImpactPerTick = installed.reduce((s, i) => s + i.planetImpact, 0);
    const planetDeltaPerSec = (gameConfig.baseDecay + totalImpactPerTick) / tickSec; // >0 damage per second
    const planetDeltaLabel = `Damage ${planetDeltaPerSec.toFixed(1)}/s`;
    const seconds = this.state.tick * tickSec;
    const score = Math.floor((seconds / 10) * 1 + planetHealth / 100 + populationHealth);

    // Ensure HUD exists and is properly initialized
    if (!this.hud) {
      console.warn("[DEBUG] Creating HUD Overlay");
      this.hud = new HudOverlay(this);
      this.hud.createHeader();
      this.hud.createHudText();
      this.hud.createHudBars();
      this.hud.reposition(this.cameras.main.width);
      this.hud.forceVisibility();
      console.warn("[DEBUG] HUD elements created:", {
        topBar: !!(this as any).hud.topBar,
        bars: "planetBarBg" in (this.hud as any)
      });
    }

    this.hud.setHudText(
      `🌍 Planet: ${planetHealth.toFixed(0)}/${gameConfig.planet.max}  ` +
      `👥 Population: ${populationHealth.toFixed(0)}/${gameConfig.population.max}  ` +
      ` 🔥 ${planetDeltaLabel}`
    );

    // Provide numeric bar labels (aligned bars baseline)
    if ((this.hud as any).setBarValues) {
      (this.hud as any).setBarValues(planetHealth, gameConfig.planet.max, populationHealth, gameConfig.population.max);
    }

    // Update score in header
    this.hud.setScore(score);

    this.hud.redrawBars(
      planetHealth / gameConfig.planet.max,
      populationHealth / gameConfig.population.max
    );

    // Force HUD elements to be visible after updates
    this.hud.forceVisibility();

    // Force redraw of header to ensure visibility
    this.hud.redrawHeader(this.cameras.main.width);
  }

  private tryHeal() {
    if (this.state.tick < this.state.healCooldownUntilTick) return;
    const healAmt = gameConfig.planet.max * gameConfig.heal.amountPct;
    const prev = this.state.planetHealth;
    this.state.planetHealth = Math.min(gameConfig.planet.max, this.state.planetHealth + healAmt);
    // eslint-disable-next-line no-console
    console.debug("[MainScene] tryHeal invoked", { prev, current: this.state.planetHealth, tick: this.state.tick });
    if (this.state.planetHealth > prev) {
      spawnFloatingText(this, "Planet healed!", { color: "#86efac", y: this.hud ? this.hud.headerHeight() + 8 : 40 });
      this.emitConfetti();
    } else {
      spawnFloatingText(this, "Planet already full", { color: "#60a5fa", y: this.hud ? this.hud.headerHeight() + 8 : 40 });
    }
    this.state.healCooldownUntilTick = this.state.tick + gameConfig.heal.cooldownSec;
  }

  // ----- Helpers for icons and educational content -----
  // Education data moved to ui/education/education.ts; provide local icon helper for legacy HTML snippets
  private iconSrc(key: string) {
    const map: Record<string, string> = { sustainableFarm: "farm" };
    return `/game/${map[key] ?? key}.svg`;
  }

  private ensureSidebar() {
    if (!this.sidebar) this.sidebar = new EconomySidebar(this, () => this.hud.headerHeight());
    this.sidebar.ensure();
  }

  private updateSidebar() {
    this.ensureSidebar();
    this.sidebar.update(this.state.installed);
  }

  // Provide host adapter for tooltip utility module
  private tooltipHost() {
    return {
      scene: this as Phaser.Scene,
      getTooltipDom: () => this.tooltipDom,
      setTooltipDom: (dom: Phaser.GameObjects.DOMElement | null) => {
        this.tooltipDom = dom;
      },
      moveTooltip: (x: number, y: number) => this.moveTooltip(x, y)
    };
  }

  // ----- Manage/Build UI -----
  private promptReplacement(badKey: BadSystemKey) {
    promptReplacementUtil(this.badSystemHost(), badKey);
  }

  private closeBottomPanel() {
    if (this.bottomPanelDom) {
      this.bottomPanelDom.destroy();
      this.bottomPanelDom = null;
    }
    this.bottomPanelCentered = false;
  }

  // Tooltip creation moved to ui/tooltips/systemTooltips.ts

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

    // Recompute desired planet size (applies to sprite version too)
    // Enlarge baseline planet size (increase scale factor & max clamp)
    const size = Math.floor(Math.min(width, height) * 0.50);
    this.planetSizePx = Math.max(240, Math.min(640, size));
    if (this.planetBase) {
      this.planetBaseX = cx;
      this.planetBaseY = cy;
      this.planetBase.setScale(this.planetSizePx / 1280).setPosition(cx, cy);
    }
    // Resize both overlay layers if present
    if (this.planetOverlayA) this.planetOverlayA.setScale(this.planetSizePx / 1024).setPosition(cx, cy);
    if (this.planetOverlayB) this.planetOverlayB.setScale(this.planetSizePx / 1024).setPosition(cx, cy);
    if (this.planetClouds) {
      this.planetCloudsBaseScale = this.planetSizePx / 1280;
      this.planetClouds.setScale(this.planetCloudsBaseScale).setPosition(cx, cy);
    }

    // Resize stars backdrop
    if (this.starsBackdropDom) {
      const root = this.starsBackdropDom.node as HTMLElement;
      root.style.width = `${width}px`;
      root.style.height = `${height}px`;
      this.starsBackdropDom.setPosition(0, 0);
    }

    // Recenter planet
    if (this.planetDom) {
      this.resizePlanetDom(cx, cy);
    }

    // Reposition industry icons around planet
    const dynamicRadius = Math.round(this.planetSizePx / 2) + 50; // keep same offset around resized planet
    this.industryIcons.forEach(({ image, angle }) => {
      const x = cx + dynamicRadius * Math.cos(angle);
      const y = cy + dynamicRadius * Math.sin(angle);
      image.setPosition(x, y);
      image.setVisible(true); // Ensure icons are visible
      image.setDepth(5); // Set appropriate depth to ensure visibility
    });

    // Reposition bottom panel if open
    if (this.bottomPanelDom) {
      const panelWidth = Math.min(820, width - 24);
      const panelMaxHeight = Math.max(170, Math.floor(height * 0.45));
      const x = (width - panelWidth) / 2;
      // Update the DOM root styles to reflect new bounds
      const root = this.bottomPanelDom.node as HTMLElement;
      if (root) {
        root.style.width = `${panelWidth}px`;
        root.style.maxHeight = `${panelMaxHeight}px`;
      }
      if (this.bottomPanelCentered) {
        const actualH = Math.min(panelMaxHeight, (this.bottomPanelDom.node as HTMLElement).getBoundingClientRect().height || panelMaxHeight);
        const y = Math.max(8, Math.floor((height - actualH) / 2));
        this.bottomPanelDom.setPosition(x, y);
      } else {
        const y = height - panelMaxHeight - 16;
        this.bottomPanelDom.setPosition(x, y);
      }
    }

    // Keep tooltip within bounds
    if (this.tooltipDom) {
      const p = this.tooltipDom;
      const x = Math.min(p.x, width - 240);
      const y = Math.min(p.y, height - 120);
      p.setPosition(x, y);
    }

    // Redraw bars to ensure correct widths after resize (only if HUD exists)
    if (this.hud) this.updateHud();

    // Reposition sidebar and header/install UI
    // Keep economy under stats when resizing
    const econTop = this.statsSidebar ? this.statsSidebar.bottomY() + 12 : undefined;
    if (this.sidebar) this.sidebar.reposition(width, height, econTop);
    if (this.statsSidebar) this.statsSidebar.reposition(width, height);
    if (this.hud) {
      this.hud.reposition(width);
      // Force visibility on resize to ensure HUD remains visible
      this.hud.forceVisibility();
    }
    // Reposition bottom toolbar
    if (this.bottomToolbarDom) {
      const x = 12;
      const y = height - 56;
      this.bottomToolbarDom.setPosition(x, y);
      const root = this.bottomToolbarDom.node as HTMLElement;
      if (root) root.style.width = `${Math.floor(width - 24)}px`;
    }
  }

  private resizePlanetDom(cx: number, cy: number) {
    if (!this.planetDom) return;
    const cam = this.cameras.main;
    const size = Math.floor(Math.min(cam.width, cam.height) * 0.42);
    this.planetSizePx = Math.max(220, Math.min(520, size));
    this.planetDom.setPosition(cx - this.planetSizePx / 2, cy - this.planetSizePx / 2);
    const node = this.planetDom.node as HTMLElement;
    const root = node.querySelector("[data-planet-root]") as HTMLElement | null;
    if (root) {
      root.style.width = `${this.planetSizePx}px`;
      root.style.height = `${this.planetSizePx}px`;
    }
  }

  private applyPlanetHealthVisuals() {
    const health = Math.max(0, Math.min(1, this.state.planetHealth / gameConfig.planet.max));
    // Map health -> overlay opacity (invert: low health => higher opacity)
    this.planetOverlayCurrentOpacity = this.planetOverlayOpacity + (1 - health) * (this.planetOverlayOpacityMax - this.planetOverlayOpacity);
    if (this.planetBase) {
      // Slight brightness shift of base image
      const baseBrightness = 0.75 + (0.25 * health);
      this.planetBase.setTint(Phaser.Display.Color.GetColor(255 * baseBrightness, 255 * baseBrightness, 255 * baseBrightness));
    }
    // Clouds alpha (base + damage boost)
    if (this.planetClouds) {
      const damageFactor = (1 - health); // 0 healthy -> 1 critical
      const targetCloudAlpha = this.planetCloudsBaseAlpha + damageFactor * (this.planetCloudsDamageBoostAlpha - this.planetCloudsBaseAlpha);
      this.planetClouds.setAlpha(targetCloudAlpha);
    }
    // Apply tinting to overlay layers if they exist
    const overlays: Phaser.GameObjects.Image[] = [];
    if (this.planetOverlayA) overlays.push(this.planetOverlayA);
    if (this.planetOverlayB) overlays.push(this.planetOverlayB);
    if (overlays.length) {
      let overlayTint: number;
      if (health > 0.66) overlayTint = 0xffffff;
      else if (health > 0.33) overlayTint = 0xffc241;
      else overlayTint = 0xff4d4d;
      overlays.forEach(o => o.setTint(overlayTint));
      // Ensure overlays reflect computed opacity (do not instantly override fades mid-transition; set on active layer only)
      if (this.planetOverlayActive) this.planetOverlayActive.setAlpha(this.planetOverlayCurrentOpacity);
      // Low health pulse only on the active overlay (avoid fighting fade tweens); pulse around current opacity
      if (health < 0.33 && this.planetOverlayActive) {
        // If there is no existing non-alpha tween changing its alpha range (we kill alpha pulses when fading)
        const activeTweens = this.tweens.getTweensOf(this.planetOverlayActive);
        const hasPulse = activeTweens.some(tw => (tw as any).data?.some?.((d: any) => d.key === "alpha" && d.duration === 1400));
        if (!hasPulse) {
          this.tweens.add({
            targets: this.planetOverlayActive,
            alpha: { from: this.planetOverlayCurrentOpacity * 0.75, to: Math.min(this.planetOverlayCurrentOpacity * 1.15, this.planetOverlayOpacityMax) },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut"
          });
        }
      }
    }
  }

  // New layered planet: base + animated overlay
  private createLayeredPlanet(centerX: number, centerY: number) {
    // Remove old sprites if present
    if (this.planetBase) this.planetBase.destroy();
    if (this.planetOverlayA) this.planetOverlayA.destroy();
    if (this.planetOverlayB) this.planetOverlayB.destroy();
    if (this.planetClouds) {
      this.planetClouds.destroy(); this.planetClouds = undefined;
    }
    if (this.planetOverlayTimer) {
      this.planetOverlayTimer.remove(false); this.planetOverlayTimer = undefined;
    }
    // Add base planet
    this.planetBase = this.add.image(centerX, centerY, "planet_base_hd").setDepth(2).setOrigin(0.5);
    this.planetBase.setScale(this.planetSizePx / 1280);
    // Add faint cloud layer
    this.planetClouds = this.add.image(centerX, centerY, "planet_base_hd").setDepth(2.5).setOrigin(0.5);
    this.planetCloudsBaseScale = this.planetSizePx / 1280;
    this.planetClouds.setScale(this.planetCloudsBaseScale).setAlpha(this.planetCloudsBaseAlpha).setBlendMode(Phaser.BlendModes.ADD);
    // Initialize overlay frames
    this.planetOverlayFrame = 0;
    this.applyPlanetHealthVisuals(); // sets planetOverlayCurrentOpacity
    this.planetOverlayA = this.add.image(centerX, centerY, "planet_noise_00").setDepth(3).setOrigin(0.5);
    this.planetOverlayA.setScale(this.planetSizePx / 1024).setAlpha(this.planetOverlayCurrentOpacity);
    this.planetOverlayB = this.add.image(centerX, centerY, "planet_noise_01").setDepth(3).setOrigin(0.5);
    this.planetOverlayB.setScale(this.planetSizePx / 1024).setAlpha(0);
    this.planetOverlayActive = this.planetOverlayA;
    this.startPlanetOverlayAnim(centerX, centerY);

  }

  private startPlanetOverlayAnim(centerX: number, centerY: number) {
    if (this.planetOverlayTimer) this.planetOverlayTimer.remove(false);
    this.planetOverlayTimer = this.time.addEvent({
      delay: this.planetOverlayFrameIntervalMs,
      loop: true,
      callback: () => {
        // Advance frame index
        this.planetOverlayFrame = (this.planetOverlayFrame + 1) % 28;
        const n = this.planetOverlayFrame.toString().padStart(2, "0");
        const outgoing = this.planetOverlayActive;
        const incoming = (outgoing === this.planetOverlayA) ? this.planetOverlayB : this.planetOverlayA;
        // Stop active tweens on both layers to avoid stacking pulses & previous fades
        this.tweens.killTweensOf(incoming);
        this.tweens.killTweensOf(outgoing);
        // Set incoming frame data
        incoming
          .setTexture(`planet_noise_${n}`)
          .setPosition(centerX, centerY)
          .setScale(this.planetSizePx / 1024)
          .setAlpha(0)
          .setDepth(3);
        // Apply tint before starting fade (so it matches health instantly)
        this.applyPlanetHealthVisuals();
        // Cross-fade with long overlap
        const fadeDur = this.planetOverlayFadeMs;
        // Recompute opacity in case health changed since last frame
        this.applyPlanetHealthVisuals();
        const targetAlpha = this.planetOverlayCurrentOpacity;
        this.tweens.add({ targets: incoming, alpha: targetAlpha, duration: fadeDur, ease: "Sine.easeInOut" });
        this.tweens.add({ targets: outgoing, alpha: 0, duration: fadeDur, ease: "Sine.easeInOut" });
        this.planetOverlayActive = incoming;
      }
    });
  }

  // ---------- Per-frame update (drift removed, only breathing) ----------
  update() {
    // No breathing / shaking: everything is static except slow rotation tweens.
    // We avoid per-frame position resets to eliminate perceived micro jitter.
    // (If future re-centering is needed after resizes, handle in handleResize.)
    if (this.populationVisuals) this.populationVisuals.update(this.game.loop.delta);
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
  // ----- Helpers to add/manage icons -----
  private addGoodIcon(goodKey: GoodSystemKey) {
    addGoodIconUtil(this.goodSystemHost(), goodKey);
  }
  // Override visual placement of good systems: disable floating icon spawn
  // (Wrap original behavior if reintroduced later.)
  // private addGoodIcon(goodKey: GoodSystemKey) { /* disabled floating placement */ }

  private promptSell(goodKey: GoodSystemKey) {
    promptSellUtil(this.goodSystemHost(), goodKey);
  }

  // ----- Bottom toolbar (installed systems + Buy System) -----
  private updateBottomToolbar() {
    this.bottomToolbarDom = updateBottomToolbar(this.bottomToolbarHost(), this.bottomToolbarDom);
  }

  // Host adapters for extracted modules
  private bottomToolbarHost() {
    return {
      scene: this as Phaser.Scene,
      state: this.state,
      promptReplacement: (b: BadSystemKey) => this.promptReplacement(b),
      promptSell: (g: GoodSystemKey) => this.promptSell(g),
      addGoodIcon: (g: GoodSystemKey) => this.addGoodIcon(g),
      headerHeight: () => this.hud.headerHeight(),
      closeBottomPanel: () => this.closeBottomPanel(),
      bottomPanelDom: this.bottomPanelDom,
      setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => {
        this.bottomPanelDom = dom;
      },
      addDom: (x: number, y: number, html: string, depth: number) => this.add.dom(x, y).createFromHTML(html).setOrigin(0, 0).setDepth(depth),
      setBottomPanelCentered: (v: boolean) => {
        this.bottomPanelCentered = v;
      },
      resources: () => this.state.resources,
      updateHud: () => this.updateHud(),
      updateSidebar: () => this.updateSidebar(),
      showBadTooltip: (k: BadSystemKey, x: number, y: number) => showTooltipForBad(this.tooltipHost(), k, x, y),
      moveTooltip: (x: number, y: number) => this.moveTooltip(x, y),
      hideTooltip: () => this.hideTooltip()
    };
  }

  private goodSystemHost() {
    return {
      scene: this as Phaser.Scene,
      state: this.state,
      planetSizePx: () => this.planetSizePx,
      industryIcons: this.industryIcons,
      setIndustryIcons: (arr: any) => {
        this.industryIcons = arr;
      },
      headerHeight: () => this.hud.headerHeight(),
      updateBottomToolbar: () => this.updateBottomToolbar(),
      updateHud: () => this.updateHud(),
      updateSidebar: () => this.updateSidebar(),
      closeBottomPanel: () => this.closeBottomPanel(),
      setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => {
        this.bottomPanelDom = dom;
      },
      bottomPanelDom: this.bottomPanelDom,
      bottomPanelCentered: this.bottomPanelCentered,
      setBottomPanelCentered: (v: boolean) => {
        this.bottomPanelCentered = v;
      }
    };
  }
  private badSystemHost() {
    return {
      scene: this as Phaser.Scene,
      state: this.state,
      iconSrc: (key: string) => this.iconSrc(key),
      closeBottomPanel: () => this.closeBottomPanel(),
      addGoodIcon: (g: GoodSystemKey) => this.addGoodIcon(g),
      headerHeight: () => this.hud.headerHeight(),
      updateHud: () => this.updateHud(),
      updateSidebar: () => this.updateSidebar(),
      setBottomPanelDom: (dom: Phaser.GameObjects.DOMElement | null) => {
        this.bottomPanelDom = dom;
      },
      setBottomPanelCentered: (v: boolean) => {
        this.bottomPanelCentered = v;
      },
      bottomPanelDom: this.bottomPanelDom,
      industryIcons: this.industryIcons
    };
  }
}
