export const gameConfig = {
  tickDurationMs: 2000,
  planet: { start: 500, max: 500 },
  population: { start: 100, max: 100, upkeep: 30 },
  resourcesStart: 500,
  baseDecay: 1,
  underfundPenalty: 6,
  planetStressThresholdPct: 0.3,
  planetStressPenalty: 2,
  badSystems: {
    oil: { key: "oil", name: "Oil Plant", resourceIncome: 20, planetImpact: 4, replaceCost: 300, sprite: "/game/oil.svg", blurb: "Oil provides lots of energy fast but emits greenhouse gases and risks spills.", pros: ["High immediate energy"], cons: ["Increases planet damage (+4/t)", "Fossil emissions"] },
    coal: { key: "coal", name: "Coal Plant", resourceIncome: 15, planetImpact: 5, replaceCost: 250, sprite: "/game/coal.svg", blurb: "Coal is reliable baseline energy but very polluting.", pros: ["Steady energy"], cons: ["High planet damage (+5/t)", "Air pollution"] },
    logging: { key: "logging", name: "Deforestation", resourceIncome: 10, planetImpact: 3, replaceCost: 200, sprite: "/game/logging.svg", blurb: "Cutting forests yields resources short-term but destroys carbon sinks.", pros: ["Quick materials"], cons: ["Planet damage (+3/t)", "Biodiversity loss"] },
  },
  goodSystems: {
    solar: { key: "solar", name: "Solar Farm", buildCost: 300, resourceIncome: 8, planetImpact: -6, installTimeTicks: 10, sprite: "/game/solar.svg", blurb: "Solar generates electricity with zero direct emissions.", pros: ["Heals planet (-6/t)"], cons: ["Lower income vs oil"] },
    wind: { key: "wind", name: "Wind Turbine", buildCost: 250, resourceIncome: 6, planetImpact: -5, installTimeTicks: 8, sprite: "/game/wind.svg", blurb: "Wind energy complements solar; together they replace polluting plants.", pros: ["Heals planet (-5/t)"], cons: ["Lower income"] },
    reforest: { key: "reforest", name: "Reforestation", buildCost: 200, resourceIncome: 2, planetImpact: -8, installTimeTicks: 12, sprite: "/game/reforest.svg", blurb: "Replanting forests captures carbon and stabilizes ecosystems.", pros: ["Strong healing (-8/t)"], cons: ["Very low income"] },
    sustainableFarm: { key: "sustainableFarm", name: "Sustainable Farm", buildCost: 220, resourceIncome: 5, planetImpact: -3, installTimeTicks: 9, sprite: "/game/farm.svg", blurb: "Sustainable farming reduces emissions and keeps soil healthy.", pros: ["Balanced heal/income"], cons: ["Moderate cost"] },
  },
} as const;

export type GameConfig = typeof gameConfig;
