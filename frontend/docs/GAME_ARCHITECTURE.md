# Save‑a‑Planet (Frontend Game) – Architecture & Guide

This document explains how the survival simulation game works in the frontend folder. It covers the game loop, modules, state, UI, assets, and how to extend or integrate new features. It also includes a short AI Agent Brief at the end for automated assistants to work productively in this project.


## Tech stack
- Next.js (app router) for the web app shell; the game lives on `/app/(protected)/game`.
- React client component `components/game/PhaserCanvas.tsx` mounts Phaser into a div container.
- Phaser 3 (DOM + WebGL) powers the simulation and UI overlays.
- UI uses Phaser Graphics, Text, and DOMElement with inline CSS.
- Static assets (SVG/PNGs/MP3) are served from `public/`.


## High‑level flow
1. `PhaserCanvas` mounts and calls `createPhaserGame(parent)`.
2. Phaser config (responsive size + RESIZE scale) bootstraps `MainScene`.
3. `MainScene.create()` initializes state, music, and a minimal HUD, then runs the educational `IntroSequence`.
4. After the intro ends, a `StartMenu` appears. Clicking Start calls `startGame()` which builds the world and starts the tick loop.
5. The game runs a 1s tick. Planet health decays from base + installed systems. Resources accumulate. Every few seconds population reacts to sufficiency of income. UI sidebars, HUD, toolbar, and population visuals update continuously. Game over appears when planet or population reaches 0.


## Key files and responsibilities

- `lib/game/createGame.ts`
  - Creates a responsive Phaser.Game attached to a parent HTMLElement.
  - Uses Scale.RESIZE; a ResizeObserver resizes the game and is disconnected on destroy.

- `lib/game/MainScene.ts`
  - Orchestrates everything: preload assets, initialize state, intro/start flow, world build, tick loop, UI composition, and game over.
  - World visuals: layered planet (base HD + cross‑faded noise overlays + faint cloud layer).
  - HUD and sidebars: `HudOverlay`, `EconomySidebar`, `StatsSidebar`.
  - Population visuals: `PopulationVisuals` animates a crowd proportional to population health.
  - Toolbar and bottom panels: managed via `ui/toolbar/bottomToolbar.ts` and `ui/systems/*`.
  - Tooltip support for bad systems and floating text effects.
  - Music: preloaded MP3 with mute toggle; safe against NoAudio environments.

- `lib/game/HudOverlay.ts`
  - Renders header band, health bars (planet & population), a score box, heal button (cooldown), and a music toggle.
  - All elements have fixed high depth and use setScrollFactor(0) to pin to the camera.

- `lib/game/EconomySidebar.ts`
  - Right panel listing installed systems, showing per‑system income and damage, plus totals. Pulses numbers when they change.

- `lib/game/StatsSidebar.ts`
  - Left panel with stats: resources, income/sec, required/sec, required per 10s, and time to next consumption.

- `lib/game/population/PopulationVisuals.ts`
  - Spawns and animates “alien” sprites to the right of the planet.
  - Count scales with populationHealth (capped). Gentle wandering and bobbing; fade‑in/out on growth/shrink.
  - Exposes `sync()` and `update(dt)`; `MainScene` calls `sync()` on state changes and `update()` per frame.

- `lib/game/ui/intro/*`
  - `introSequence.ts`: Manages an educational slide sequence (DOM) before the game starts.
  - `introSlides.ts`: Content for slides.

- `lib/game/ui/menus/*`
  - `startMenu.ts`: Start overlay with framing and “Commence Simulation” button.
  - `gameOverScreen.ts`: Full‑screen overlay with score, stats, narrative summary, and Restart.

- `lib/game/ui/toolbar/bottomToolbar.ts`
  - Fixed bottom toolbar listing installed systems as buttons (bad/good), a Buy System button, and Surrender.
  - Handles clicks to open build/sell/replace panels and tooltips for bad systems.

- `lib/game/ui/systems/*`
  - `badSystems.ts`: Replacement panel flow for removing polluters and building sustainable systems.
  - `goodSystems.ts`: Build/sell flow for good systems and optional floating icon placement.

- `lib/game/ui/panels/buildPanels.ts`
  - Shared panel renderer for “replacement/build” flows (kept generic and presentational).

- `lib/game/ui/effects/floatingText.ts`
  - Utility to spawn transient HUD‑like messages that rise and fade.

- `lib/game/ui/tooltips/*`
  - `systemTooltips.ts`: Simple tooltip spawner for good/bad systems.
  - `tooltipManager.ts`: An alternative encapsulated manager (currently unused by MainScene).

- `data/gameConfig.ts`
  - The single source of truth for tuning numbers and system definitions.

- `components/game/PhaserCanvas.tsx`
  - React wrapper that creates and cleans up the Phaser game instance.

- `app/(protected)/game/page.tsx`
  - Route for the game screen that renders `PhaserCanvas`.


## Game state and mechanics

- Types: `lib/game/types.ts`
  - GameState
    - tick: number (seconds since start)
    - planetHealth: number (0..max)
    - populationHealth: number (0..max)
    - resources: number
    - installed: InstalledSystem[] ({ key, type: "bad" | "good", resourceIncome, planetImpact, spriteKey })
    - lastConsumptionTick, lastHealTick, healCooldownUntilTick
    - gameOver: boolean

- Config: `data/gameConfig.ts`
  - tickDurationMs = 1000
  - planet, population start/max; baseDecay; removeBadCost, sellRefundPct; heal amount/cooldown
  - Consumption/heal dynamics:
    - Every 10s: subtract resources = populationHealth * populationConsumptionPer10sPerCapita
    - Every populationCheckIntervalSec (e.g., 4s):
      - requiredPerSec = (populationHealth * minIncomePerPopPer10s) / 10
      - if resources >= requiredPerSec * populationHealThresholdMultiplier → population +populationHealPerCheck
      - else if resources < requiredPerSec → population -populationDecayPerCheck
  - badSystems (oil, coal, logging) and goodSystems (solar, wind, sustainableFarm, reforest) with build costs, income, and planetImpact.

- Tick loop: `MainScene.onTick()` every second
  1) planetHealth -= baseDecay + sum(installed.planetImpact)
  2) resources += sum(installed.resourceIncome)
  3) every 10s: deduct population consumption from resources
  4) every N seconds: adjust populationHealth based on income sufficiency
  5) if planetHealth < stress threshold: populationHealth -= planetStressPenalty
  6) clamp health values; if any reaches 0 → game over (stop timer, show overlay)
  7) update HUD, sidebars, toolbar, visuals

- Scoring (shown on HUD and Game Over):
  - score ≈ (time survived / 10) + planetHealth/100 + populationHealth


## Visuals and UI layering

- Planet rendering: `createLayeredPlanet()`
  - Base image (1280²) tinted by health; faint cloud layer (additive) with alpha scaling by damage.
  - Two overlay layers cross‑fade through 28 noise textures every ~2.2s with long 3s fades.
  - Overlay tint and pulsing vary with health; alpha scales inversely with health.

- HUD: `HudOverlay`
  - Fixed header (56px), planet and population bars under the planet, a heal button below bars, score box at top‑right, and a top‑right music toggle.
  - `updateHealButtonCooldown(seconds)` switches the button state and disables interaction.
  - `setBarValues(...)` updates numeric labels; `redrawBars(planetPct, popPct)` paints backgrounds and fills.

- Sidebars
  - `StatsSidebar`: left panel under the header with resource/income/requirements + countdown to next 10s consumption.
  - `EconomySidebar`: stacked under Stats; lists installed systems with chips for total income and planet damage per second.

- Bottom toolbar
  - Buttons for each installed system: clicking a bad system opens a replacement panel; clicking a good system opens a sell panel.
  - Buy System opens a global build selector with affordability/requirements checks.
  - Surrender flags gameOver and asks the scene to show the Game Over screen.

- Tooltips and floating text
  - Hovering a bad system button shows a tooltip with income/damage and a blurb.
  - `spawnFloatingText` is used for toasts (install/sell/consumption/heal etc.).

- Population visuals
  - Crowd appears to the right of the planet. More population → more sprites, slight outward/downward shift, and denser vertical compression.


## Lifecycle and safety
- Scene listens for SHUTDOWN and cleans population visuals and music.
- `createPhaserGame` patches `game.destroy` to detach ResizeObserver.
- UI DOM elements are guarded for existence/destroyed states before repositioning.
- On resize, `MainScene.handleResize` recomputes planet size, repositions overlays, sidebars, toolbars, tooltips, and updates HUD.


## Extending the game

- Add a new system
  1) Define it in `data/gameConfig.ts` under `goodSystems` or `badSystems`.
  2) Provide an icon in `public/game/*.svg` (for farm use `sustainableFarm -> farm.svg` mapping).
  3) Add education bullets in `ui/education/education.ts`.
  4) No code changes needed for most flows: toolbar, build panels, and economy sidebar read from config/state.

- Tune mechanics
  - Adjust `population*` and `planet*` constants in `gameConfig.ts`.
  - Tick rates, heal amount/cooldown, costs, and thresholds are all centralized.

- Modify visuals
  - Planet overlays: add/remove noise frames (`public/game/sprites/planet-parts/noiseNN.png`) and update loops.
  - Crowd behavior: tweak constants in `PopulationVisuals`.

- Add UI
  - Use Phaser DOM elements with inline CSS for rapid iteration. Keep depth high (≥25) to sit above world sprites.
  - Reuse patterns from `bottomToolbar.ts` or `gameOverScreen.ts`.


## Contracts and helpers
- HUD
  - `headerHeight(): number` is used by panels to position floating text.
  - `createHealButton(onClick)` and `updateHealButtonCooldown(seconds)` manage the heal CTA.

- Toolbar Host (from `MainScene`)
  - Provides: `state`, `promptReplacement`, `promptSell`, `addGoodIcon`, DOM adders, tooltip callbacks, and `resources()`.

- Good/Bad System Hosts
  - Both receive accessors for `state`, `headerHeight`, panel setters, and update callbacks.


## Edge cases and safeguards
- Avoid touching destroyed DOM elements during scene restarts; modules check `.destroyed` flags where relevant.
- Tooltip DOM is unique; always destroy previous tooltip before showing a new one.
- Audio: if `setMute` is unavailable in the browser’s sound manager, fallback adjusts volume to 0.
- Prevent overlapping fade/pulse tweens on overlay frames by killing tweens before swapping textures.


## File map (frontend only)
- Game core: `lib/game/MainScene.ts`, `lib/game/createGame.ts`, `lib/game/types.ts`
- UI core: `lib/game/HudOverlay.ts`, `lib/game/EconomySidebar.ts`, `lib/game/StatsSidebar.ts`
- Systems UI: `lib/game/ui/systems/*`, `lib/game/ui/panels/buildPanels.ts`, `lib/game/ui/toolbar/bottomToolbar.ts`
- Education + Tooltips + Effects: `lib/game/ui/education/education.ts`, `lib/game/ui/tooltips/*`, `lib/game/ui/effects/floatingText.ts`
- Population visuals: `lib/game/population/PopulationVisuals.ts`
- Intro + Menus: `lib/game/ui/intro/*`, `lib/game/ui/menus/*`
- Config + route + mount: `data/gameConfig.ts`, `components/game/PhaserCanvas.tsx`, `app/(protected)/game/page.tsx`


---

## AI Agent Brief (paste into new chats)

Context:
- You’re assisting on the frontend survival simulation built with Next.js + Phaser (no backend coupling required for gameplay). The game lives under `frontend/` and runs at `app/(protected)/game`.

Core mechanics:
- 1‑second tick. Planet health decays by baseDecay + sum(system.planetImpact). Resources += sum(system.resourceIncome).
- Every 10s deduct resources = population * populationConsumptionPer10sPerCapita.
- Every `populationCheckIntervalSec` seconds, population changes based on whether resources cover required/sec (derived from `minIncomePerPopPer10s`) with a heal threshold multiplier.
- Game over when planet or population hits 0.

State:
- `GameState` in `lib/game/types.ts`. Systems are just entries in `state.installed`; add/remove them to affect economy and damage.

UI:
- `HudOverlay` header + bars + heal + music.
- `StatsSidebar` (left) + `EconomySidebar` (right).
- `bottomToolbar` with installed system buttons, Buy System, and Surrender.
- Build/Replace flows in `ui/systems/*`; floating messages via `ui/effects/floatingText`.

Key extension points:
- Add / tune systems via `data/gameConfig.ts` and `ui/education/education.ts`.
- Visuals: `PopulationVisuals` and layered planet methods in `MainScene`.
- Panels/toolbars use Phaser DOM; replicate patterns to add new UI quickly.

Gotchas:
- Always guard against destroyed Phaser DOM/Text when restarting scenes or on resize.
- Resize paths must recompute positions and widths; call `updateHud`, `updateSidebar`, and `updateBottomToolbar` after significant changes.
- Audio manager may lack `setMute`; if so, change volume to 0.

Acceptance check:
- After changes, the game should still mount via `PhaserCanvas`, start with Intro → Start Menu → Game world, run ticks at 1/s, respond to Buy/Replace/Sell panels, and reach Game Over with restart.
