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
import { PlanetManager } from "./planet/PlanetManager";
import { computeScore } from "./score";
export default class MainScene extends Phaser.Scene {
  private state!: GameState;
  // Planet rendering handled by PlanetManager
  private planet?: PlanetManager;
  private planetSizePx: number = 260;
  // UI modules
  private hud!: HudOverlay;
  private sidebar!: EconomySidebar;
  // Legacy fields removed
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
  // Background music
  private bgm?: Phaser.Sound.BaseSound;

  // Confetti particle texture guard
  private confettiReady: boolean = false;

  constructor() {
    super("MainScene");
    // (Noise table creation left intact if future subtle drift needed)
    // constructor intentionally minimal
  }

  preload() {
    this.load.svg("planet", "/game/planet.svg", { width: 256, height: 256 });
    this.load.image("oil", "/game/oil.png");
    this.load.image("coal", "/game/coal.png");
    this.load.image("logging", "/game/logging.png");
    this.load.image("solar", "/game/solar.png");
    this.load.image("wind", "/game/wind.png");
    this.load.image("reforest", "/game/reforest.png");
    this.load.image("sustainableFarm", "/game/farm.png");
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
    // Background music (space in filename must be URL-encoded). Stored in Next.js public/music
    // If you rename the file to remove spaces, update the path accordingly.
    this.load.audio("bgm_main", ["/music/Underneath%20Skies.mp3"]);
  }

  create() {
    this.initState();
    // Start background music immediately (during intro) so it plays throughout.
    this.ensureMusic();
    // We are about to show the intro; mark as active so HUD initializes in minimal mode (music button only)
    this.introActive = true;
    // Ensure HUD exists early so we can show the music toggle during intro
    this.ensureHud();
    // Music button is created within ensureHud and kept in sync.
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
      if (this.bgm) {
        try {
          this.bgm.stop();
        } catch { /* ignore */ }
        this.bgm.destroy();
        this.bgm = undefined;
      }
    });
  }

  private initWorld() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Build planet (now only rotating base image)
    // Build planet via manager
    if (!this.planet) this.planet = new PlanetManager(this, () => Math.max(0, Math.min(1, this.state.planetHealth / gameConfig.planet.max)));
    this.planet.init(centerX, centerY);
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
    // If intro active, start with minimal HUD (only music button)
    this.hud = new HudOverlay(this, this.introActive === true);
    if (!this.introActive) {
      this.hud.createHudText();
      this.hud.createHudBars();
    }
    // Always create the music button (both intro and gameplay)
    if ((this.hud as any).createMusicButton) {
      (this.hud as any).createMusicButton((on: boolean) => {
        if (this.bgm) {
          const anySound: any = this.bgm as any;
          if (typeof anySound.setMute === "function") {
            anySound.setMute(!on);
          } else {
            if (!on) {
              anySound.__prevVol = anySound.volume ?? 0.4;
              anySound.setVolume(0);
            } else {
              anySound.setVolume(anySound.__prevVol ?? 0.4);
            }
          }
        }
        // Persist to localStorage (1 = muted, 0 = unmuted)
        try {
          window?.localStorage?.setItem("sap_audio_muted", on ? "0" : "1");
        } catch { /* ignore */ }
      });
      // Reflect initial label: prefer persisted value; else derive from bgm
      let desiredOn: boolean | null = null;
      try {
        const saved = window?.localStorage?.getItem("sap_audio_muted");
        if (saved === "1" || saved === "true") desiredOn = false;
        else if (saved === "0" || saved === "false") desiredOn = true;
      } catch { /* ignore */ }
      if (desiredOn === null) {
        const bgmAny: any = this.bgm as any;
        const isMuted = bgmAny ? (typeof bgmAny.mute === "boolean" ? bgmAny.mute : (bgmAny.volume === 0)) : false;
        desiredOn = !isMuted;
      }
      if ((this.hud as any).setMusicOn && desiredOn !== null) {
        (this.hud as any).setMusicOn(desiredOn);
      }
    }
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
    // We are leaving the intro; switch HUD from minimal to full without losing the music button
    this.introActive = false;

    if (this.hud) {
      // If HUD was minimal, expand in-place (preserves music button and avoids duplicates)
      if ((this.hud as any).minimal === true && (this.hud as any).expandToFull) {
        (this.hud as any).expandToFull();
      }
    } else {
      // If somehow no HUD, ensure fresh one
      this.ensureHud();
    }

    // Build the world and UI now
    this.initWorld();
    // Reset toolbar DOM ref to force clean rebuild on first updateBottomToolbar after restart
    this.bottomToolbarDom = null;
    this.startTickLoop();

    // Music button is created by ensureHud + header redraw; no need to recreate here

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
    this.introActive = true;
    this.introSequence = new IntroSequence(this, {
      onComplete: () => {
        // Keep minimal HUD during intro; full HUD will be created fresh in startGame
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

    // 4) Every Xs: population decay/heal based on income sufficiency (resource bank based)
    if (this.state.tick - this.state.lastHealTick >= gameConfig.populationCheckIntervalSec) {
      // Required income per second based on minimum per population point: (pop * minPer10s) / 10
      const requiredPerSec = (this.state.populationHealth * gameConfig.minIncomePerPopPer10s) / 10;
      // Keep original bank-based logic: compare resources vs thresholds
      if (this.state.resources >= requiredPerSec * gameConfig.populationHealThresholdMultiplier) {
        // Heal if we have multiplier more than required
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
      spawnFloatingText(this, "Planet is under stress! Population -1", { color: "#f87171" });
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

    // Update mini crowd info panel (above population characters)
    if (this.hud && (this.hud as any).updateCrowdInfo) {
      const peopleCount = Math.max(0, Math.floor(this.state.populationHealth));
      (this.hud as any).updateCrowdInfo({
        peopleCount,
        requiredPerSec,
        requiredPer10s: this.state.populationHealth * gameConfig.minIncomePerPopPer10s,
        incomePerSec,
        resources: this.state.resources,
        popCostPer10s,
        secondsUntilUpkeep
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
    if (this.planet) this.planet.getKeepObjects().forEach(o => keep.add(o));

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
    const score = computeScore({
      tick: this.state.tick,
      tickDurationMs: gameConfig.tickDurationMs,
      populationHealth
    });

    // Ensure HUD exists and is properly initialized
    if (!this.hud) {
      console.warn("[DEBUG] Creating HUD Overlay");
      this.hud = new HudOverlay(this);
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

  // ----- Music helpers -----
  private ensureMusic() {
    // Guard for environments with NoAudioSoundManager
    const sm: any = this.sound as any;
    if (!sm) return;
    if (!this.bgm) {
      if (!this.sound.get("bgm_main")) {
        // If asset somehow not loaded, attempt dynamic load (Phaser supports late load)
        try {
          this.load.audio("bgm_main", ["/music/Underneath%20Skies.mp3"]); this.load.start();
        } catch { /* ignore */ }
      }
      // Determine initial mute state from localStorage (default On)
      let startMuted = false;
      try {
        const saved = window?.localStorage?.getItem("sap_audio_muted");
        if (saved === "1" || saved === "true") startMuted = true;
      } catch { /* SSR or blocked storage */ }
      // Create sound with persisted mute state
      this.bgm = this.sound.add("bgm_main", { loop: true, volume: 0.4, mute: startMuted as any });
      this.bgm.play();
      const anySound: any = this.bgm as any;
      if (typeof anySound.setMute === "function") {
        anySound.setMute(startMuted);
      } else {
        anySound.__prevVol = anySound.volume ?? 0.4;
        anySound.setVolume(startMuted ? 0 : (anySound.__prevVol ?? 0.4));
      }
    }
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
    // Prefer PNG variants for crisper raster visuals in UI panels
    return `/game/${map[key] ?? key}.png`;
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

    // Recompute desired planet size handled by PlanetManager
    // Resize planet via manager
    if (this.planet) this.planet.onResize(width, height);
    this.planetSizePx = this.planet ? this.planet.getSizePx() : this.planetSizePx;

    // Resize stars backdrop
    if (this.starsBackdropDom) {
      const root = this.starsBackdropDom.node as HTMLElement;
      root.style.width = `${width}px`;
      root.style.height = `${height}px`;
      this.starsBackdropDom.setPosition(0, 0);
    }

    // Recenter planet
    // Recenter planet (handled by PlanetManager)

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
      const root = this.bottomPanelDom.node as (HTMLElement | null);
      if (root) {
        root.style.width = `${panelWidth}px`;
        root.style.maxHeight = `${panelMaxHeight}px`;
      }
      if (this.bottomPanelCentered) {
        const actualH = Math.min(panelMaxHeight, root ? (root.getBoundingClientRect().height || panelMaxHeight) : panelMaxHeight);
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
    // Keep crowd info positioned on resize
    if (this.hud && (this.hud as any).updateCrowdInfo) {
      const incomePerSec = this.state.installed.reduce((sum, s) => sum + s.resourceIncome, 0);
      const requiredPerSec = (this.state.populationHealth * gameConfig.minIncomePerPopPer10s) / 10;
      const secondsUntilUpkeep = Math.max(0, this.state.lastConsumptionTick + 10 - this.state.tick);
      const popCostPer10s = this.state.populationHealth * gameConfig.populationConsumptionPer10sPerCapita;
      (this.hud as any).updateCrowdInfo({
        peopleCount: Math.max(0, Math.floor(this.state.populationHealth)),
        requiredPerSec,
        requiredPer10s: this.state.populationHealth * gameConfig.minIncomePerPopPer10s,
        incomePerSec,
        resources: this.state.resources,
        popCostPer10s,
        secondsUntilUpkeep
      });
    }

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
      const root = this.bottomToolbarDom.node as HTMLElement;
      if (root) {
        root.style.width = `${Math.floor(width - 24)}px`;
        const h = root.getBoundingClientRect().height || 56;
        const y = height - Math.ceil(h) - 12;
        this.bottomToolbarDom.setPosition(x, y);
      } else {
        // fallback
        const y = height - 72;
        this.bottomToolbarDom.setPosition(x, y);
      }
    }
  }

  // resizePlanetDom removed; PlanetManager handles sizing

  private applyPlanetHealthVisuals() {
    if (this.planet) this.planet.applyHealthVisuals();
  }

  // Old planet overlay animation removed; handled by PlanetManager

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
