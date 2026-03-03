export function applyEnergyRegen(current: number, lastRegenAt: Date) {
  const now = Date.now();
  const deltaSeconds = Math.floor((now - lastRegenAt.getTime()) / 1000);
  const regen = Math.floor(deltaSeconds / 60);

  if (regen <= 0) return { energy: current, lastRegenAt };

  const newEnergy = Math.min(100, current + regen);

  return {
    energy: newEnergy,
    lastRegenAt: new Date(lastRegenAt.getTime() + regen * 60000)
  };
}
