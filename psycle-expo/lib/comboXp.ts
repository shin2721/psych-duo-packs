import type { ComboXpConfig } from "./gamificationConfig";

function normalizePositiveInt(value: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : fallback;
}

function normalizeMultiplier(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return value > 1 ? value : 1;
}

export function getComboMultiplier(streak: number, config: ComboXpConfig): number {
    if (!config.enabled) return 1;
    if (!Number.isFinite(streak)) return 1;
    const safeStreak = Math.max(0, Math.floor(streak));

    let multiplier = 1;
    for (const milestone of config.milestones) {
        const milestoneStreak = normalizePositiveInt(milestone.streak, 0);
        if (milestoneStreak > 0 && safeStreak >= milestoneStreak) {
            multiplier = Math.max(multiplier, normalizeMultiplier(milestone.multiplier));
        }
    }
    return multiplier;
}

export function computeComboBonusXp(input: {
    baseXp: number;
    streak: number;
    usedBonusXp: number;
    cap: number;
    config: ComboXpConfig;
}): {
    bonusXp: number;
    nextUsedBonusXp: number;
    multiplier: number;
} {
    const baseXp = Math.max(0, Math.floor(input.baseXp));
    const usedBonusXp = Math.max(0, Math.floor(input.usedBonusXp));
    const cap = Math.max(0, Math.floor(input.cap));
    const multiplier = getComboMultiplier(input.streak, input.config);

    if (!input.config.enabled || baseXp <= 0 || multiplier <= 1 || cap <= usedBonusXp) {
        return {
            bonusXp: 0,
            nextUsedBonusXp: usedBonusXp,
            multiplier: 1,
        };
    }

    const rawBonusXp = Math.floor(baseXp * (multiplier - 1));
    const remainingCap = cap - usedBonusXp;
    const bonusXp = Math.max(0, Math.min(rawBonusXp, remainingCap));

    return {
        bonusXp,
        nextUsedBonusXp: usedBonusXp + bonusXp,
        multiplier,
    };
}
