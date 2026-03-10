export type CombatResultPayload = {
  attackerId: string;
  defenderId: string;
  damage: number;
  hit: boolean;
  bulletsUsed: number;
  severity?: number;
  recoveryUntil?: number;
  critical?: boolean;
  death?: boolean;
};
