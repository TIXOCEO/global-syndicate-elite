export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type AttackType =
  | "STANDARD"
  | "ROBBERY"
  | "AMBUSH"
  | "ASSASSINATION"
  | "WARSTRIKE";

export function calculateSeverity(
  damage: number,
  bulletsUsed: number,
  tierA: number,
  tierD: number,
  defense: number = 0,
  attackType: AttackType = "STANDARD"
): number {
  const damageNorm = clamp(damage / 260, 0, 1);

  const bulletNorm =
    Math.log(1 + bulletsUsed) / Math.log(1 + 50000);

  const rankNorm = clamp((tierA - tierD + 5) / 10, 0, 1);

  const defNorm = clamp(defense / 100, 0, 1);

  const injuryMult: Record<AttackType, number> = {
    STANDARD: 1.0,
    ROBBERY: 0.85,
    AMBUSH: 1.25,
    ASSASSINATION: 1.5,
    WARSTRIKE: 1.35
  };

  const sRaw =
    100 *
    injuryMult[attackType] *
    (
      0.55 * damageNorm +
      0.25 * bulletNorm +
      0.15 * rankNorm +
      0.10 * (1 - defNorm)
    );

  return clamp(sRaw, 0, 140);
}

export function calculateRecoveryHours(severity: number): number {
  const baseRecoveryHours =
    24 * Math.pow(severity / 100, 1.15);

  return clamp(baseRecoveryHours, 0.25, 24);
}
