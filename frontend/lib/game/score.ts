export function computeScore(params: {
  tick: number;
  tickDurationMs: number;
  populationHealth: number;
}): number {
  const seconds = params.tick * (params.tickDurationMs / 1000);
  // Primary: time survived (1 point per second)
  const timeScore = Math.floor(seconds);
  // Bonus: surviving population (weighted modestly)
  const populationBonus = Math.round(params.populationHealth * 2);
  return timeScore + populationBonus;
}
