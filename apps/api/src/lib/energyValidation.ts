export function assertEnergyAvailable(
  currentEnergy: number,
  required: number
) {
  if (currentEnergy < required) {
    throw new Error("Not enough energy");
  }
}
