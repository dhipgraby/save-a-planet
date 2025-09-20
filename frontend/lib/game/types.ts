export type BadSystemKey = "oil" | "coal" | "logging";
export type GoodSystemKey = "solar" | "wind" | "reforest" | "sustainableFarm";

export interface InstalledSystem {
  key: string;
  type: "bad" | "good";
  resourceIncome: number;
  planetImpact: number;
  spriteKey: string;
}

export interface GameState {
  tick: number;
  planetHealth: number;
  populationHealth: number;
  resources: number;
  installed: InstalledSystem[];
  // New mechanics
  lastConsumptionTick: number; // last 10s boundary processed
  lastHealTick: number; // last 5s boundary processed for population heal
  healCooldownUntilTick: number; // tick number until which heal is on cooldown
  gameOver: boolean;
}
