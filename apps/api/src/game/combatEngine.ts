export function bulletEffect(B: number) {
  const x = Math.log(1 + B);
  return x / (x + 6.5);
}

export function computeHitChance(
  shootingSkill: number,
  tierA: number,
  tierD: number,
  bullets: number
) {
  const BE = bulletEffect(bullets);

  const accBase = Math.max(
    0.05,
    Math.min(0.65, 0.14 + 0.0055 * shootingSkill)
  );

  const rankMod = Math.max(
    0.7,
    Math.min(1.3, 0.9 + 0.04 * (tierA - tierD))
  );

  const pHit = Math.max(
    0.01,
    Math.min(
      0.93,
      accBase * rankMod + 0.58 * BE
    )
  );

  return pHit;
}

export function computeDamage(bullets: number) {
  const BE = bulletEffect(bullets);

  const raw =
    (80 + Math.random() * 80) *
    (0.55 + 0.95 * BE);

  return raw;
}

export function computeShootXP(bullets: number, hit: boolean) {
  return (
    4 +
    Math.floor(12 * Math.log(1 + bullets / 50)) +
    (hit ? 8 : 2)
  );
}

export function computeRXP(bullets: number, hit: boolean) {
  return (
    18 +
    Math.floor(10 * Math.log(1 + bullets / 150)) +
    (hit ? 10 : 0)
  );
}

export function computeNotoriety(bullets: number, hit: boolean) {
  return (
    10 +
    Math.floor(4.5 * Math.sqrt(bullets)) +
    (hit ? 12 : 6)
  );
}
