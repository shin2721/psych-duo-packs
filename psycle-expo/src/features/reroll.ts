// src/features/reroll.ts
import entitlements from "../../config/entitlements.json";

interface Item {
  id: string;
  tags: string[];
  beta: number; // Difficulty
  profile: "lite" | "pro";
}

interface RerollLimits {
  perItem: number;
  perLesson: number;
}

const BETA_TOLERANCE = entitlements.defaults.reroll_beta_tolerance;

/**
 * Find alternative item for reroll
 * Requirements: same tags, beta within ±0.1, same profile, different ID
 */
export function findAltItem(itemBank: Item[], currentItem: Item): Item | null {
  const candidates = itemBank.filter((item) => {
    // Must be different item
    if (item.id === currentItem.id) {
      return false;
    }

    // Must have same profile
    if (item.profile !== currentItem.profile) {
      return false;
    }

    // Must have beta within tolerance
    const betaDiff = Math.abs(item.beta - currentItem.beta);
    if (betaDiff > BETA_TOLERANCE) {
      return false;
    }

    // Must share at least one tag
    const hasCommonTag = item.tags.some((tag) => currentItem.tags.includes(tag));
    if (!hasCommonTag) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  // Prefer items with more matching tags
  candidates.sort((a, b) => {
    const aMatchCount = a.tags.filter((tag) => currentItem.tags.includes(tag)).length;
    const bMatchCount = b.tags.filter((tag) => currentItem.tags.includes(tag)).length;

    if (aMatchCount !== bMatchCount) {
      return bMatchCount - aMatchCount;
    }

    // Secondary: prefer closer beta
    const aBetaDiff = Math.abs(a.beta - currentItem.beta);
    const bBetaDiff = Math.abs(b.beta - currentItem.beta);
    return aBetaDiff - bBetaDiff;
  });

  return candidates[0];
}

/**
 * Check if user can reroll in current lesson
 */
export function canRerollInLesson(
  usedForThisItem: number,
  usedInLesson: number,
  limits: RerollLimits
): boolean {
  return usedForThisItem < limits.perItem && usedInLesson < limits.perLesson;
}

/**
 * Determine if reroll button should be shown based on performance triggers
 */
export function shouldShowRerollTrigger(
  consecutiveMistakes: number,
  consecutiveLongThink: number,
  estimatedP: number
): boolean {
  // Trigger if any condition is met
  return (
    consecutiveMistakes >= 2 ||
    consecutiveLongThink >= 2 ||
    estimatedP < 0.4
  );
}

/**
 * Get reroll usage stats for display
 */
export interface RerollStats {
  itemRemaining: number;
  lessonRemaining: number;
  itemTotal: number;
  lessonTotal: number;
}

export function getRerollStats(
  usedForThisItem: number,
  usedInLesson: number,
  limits: RerollLimits
): RerollStats {
  return {
    itemRemaining: Math.max(0, limits.perItem - usedForThisItem),
    lessonRemaining: Math.max(0, limits.perLesson - usedInLesson),
    itemTotal: limits.perItem,
    lessonTotal: limits.perLesson,
  };
}

/**
 * Filter item bank by profile access
 */
export function filterItemsByProfile(
  itemBank: Item[],
  allowPro: boolean
): Item[] {
  if (allowPro) {
    return itemBank; // Max plan: access all
  }

  return itemBank.filter((item) => item.profile === "lite");
}

/**
 * Find multiple alternatives (for preview or batch operations)
 */
export function findMultipleAlts(
  itemBank: Item[],
  currentItem: Item,
  count: number = 3
): Item[] {
  const candidates = itemBank.filter((item) => {
    if (item.id === currentItem.id) return false;
    if (item.profile !== currentItem.profile) return false;

    const betaDiff = Math.abs(item.beta - currentItem.beta);
    if (betaDiff > BETA_TOLERANCE) return false;

    const hasCommonTag = item.tags.some((tag) => currentItem.tags.includes(tag));
    return hasCommonTag;
  });

  // Sort by quality (tag match count, then beta closeness)
  candidates.sort((a, b) => {
    const aMatchCount = a.tags.filter((tag) => currentItem.tags.includes(tag)).length;
    const bMatchCount = b.tags.filter((tag) => currentItem.tags.includes(tag)).length;

    if (aMatchCount !== bMatchCount) {
      return bMatchCount - aMatchCount;
    }

    const aBetaDiff = Math.abs(a.beta - currentItem.beta);
    const bBetaDiff = Math.abs(b.beta - currentItem.beta);
    return aBetaDiff - bBetaDiff;
  });

  return candidates.slice(0, count);
}
