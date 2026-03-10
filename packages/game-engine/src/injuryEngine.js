"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.calculateSeverity = calculateSeverity;
exports.calculateRecoveryHours = calculateRecoveryHours;
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function calculateSeverity(damage, bulletsUsed, tierA, tierD, defense = 0, attackType = "STANDARD") {
    const damageNorm = clamp(damage / 260, 0, 1);
    const bulletNorm = Math.log(1 + bulletsUsed) /
        Math.log(1 + 50000);
    const rankNorm = clamp((tierA - tierD + 5) / 10, 0, 1);
    const defNorm = clamp(defense / 100, 0, 1);
    const injuryMult = {
        STANDARD: 1.0,
        ROBBERY: 0.85,
        AMBUSH: 1.25,
        ASSASSINATION: 1.5,
        WARSTRIKE: 1.35
    };
    const raw = 100 *
        injuryMult[attackType] *
        (0.55 * damageNorm +
            0.25 * bulletNorm +
            0.15 * rankNorm +
            0.10 * (1 - defNorm));
    return clamp(raw, 0, 140);
}
function calculateRecoveryHours(severity) {
    const base = 24 * Math.pow(severity / 100, 1.15);
    return clamp(base, 0.25, 24);
}
