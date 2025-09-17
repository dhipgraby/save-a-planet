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
  installing: { key: GoodSystemKey; remainingTicks: number } | null;
  gameOver: boolean;
}
