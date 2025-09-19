export const gameConfig = {
  // Game ticks every second now
  tickDurationMs: 1000,
  planet: { start: 2000, max: 2000 },
  population: { start: 40, max: 100 },
  resourcesStart: 500,
  // Planet baseline damage per second; total planet delta = baseDecay + sum(planetImpact)
  baseDecay: 1,
  // Population consumption: resources consumed every 10 seconds based on alive population
  populationConsumptionPer10sPerCapita: 4,
  // New population dynamics (5s checks instead of 10s deductions)
  // We still DISPLAY the required resources per 10s, but we CHECK every 5s:
  // - If income/sec < required/sec, population decays by this many points per check
  // - If income/sec >= required/sec * 1.4, population heals by this many points per check
  populationCheckIntervalSec: 4,
  populationDecayPerCheck: 4,
  populationHealPerCheck: 2,
  populationHealThresholdMultiplier: 1.2,
  // Minimum income per population point per 10s to sustain (used for 5s checks and 10s deduction)
  minIncomePerPopPer10s: 180,
  // Requirements and economy actions
  minPopulationToBuy: 20,
  maxPopulationToBuy: 90,
  removeBadCost: 350,
  sellRefundPct: 0.3,
  // Heal button (planet cannot be healed by systems)
  heal: { amountPct: 0.1, cooldownSec: 15 },
  // Visual stress thresholds retained for UI cues
  planetStressThresholdPct: 0.3,
  planetStressPenalty: 1,
  badSystems: {
    oil: { key: "oil", name: "Oil Plant", resourceIncome: 20, planetImpact: 12, sprite: "/game/oil.svg", blurb: "Oil provides lots of energy fast but emits greenhouse gases and risks spills.", pros: ["High immediate energy"], cons: ["Higher planet damage"] },
    coal: { key: "coal", name: "Coal Plant", resourceIncome: 10, planetImpact: 8, sprite: "/game/coal.svg", blurb: "Coal is reliable baseline energy but very polluting.", pros: ["Steady energy"], cons: ["High planet damage"] },
    logging: { key: "logging", name: "Deforestation", resourceIncome: 10, planetImpact: 20, sprite: "/game/logging.svg", blurb: "Cutting forests yields resources short-term but destroys carbon sinks.", pros: ["Quick materials"], cons: ["Planet damage", "Biodiversity loss"] },
  },
  // Good systems damage less (cannot heal planet), and produce fewer resources
  goodSystems: {
    solar: { key: "solar", name: "Solar Farm", buildCost: 300, resourceIncome: 8, planetImpact: 6, populationRequired: 30, sprite: "/game/solar.svg", blurb: "Solar generates electricity with low lifecycle emissions.", pros: ["Low planet damage"], cons: ["Lower income vs oil"] },
    wind: { key: "wind", name: "Wind Turbine", buildCost: 450, resourceIncome: 12, planetImpact: 4, populationRequired: 35, sprite: "/game/wind.svg", blurb: "Wind energy complements solar; together they reduce reliance on fossil fuels.", pros: ["Low planet damage"], cons: ["Lower income"] },
    sustainableFarm: { key: "sustainableFarm", name: "Sustainable Farm", buildCost: 620, resourceIncome: 10, planetImpact: 3, populationRequired: 40, sprite: "/game/farm.svg", blurb: "Sustainable farming reduces emissions and keeps soil healthy.", pros: ["Balanced damage/income"], cons: ["Moderate cost"] },
    reforest: { key: "reforest", name: "Reforestation", buildCost: 1000, resourceIncome: 2, planetImpact: 0, populationRequired: 60, sprite: "/game/reforest.svg", blurb: "Replanting forests stabilizes ecosystems; no direct energy income.", pros: ["No extra planet damage"], cons: ["Very low income"] },
  },
} as const;

export type GameConfig = typeof gameConfig;
