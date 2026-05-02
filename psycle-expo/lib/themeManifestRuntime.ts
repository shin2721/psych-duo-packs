import type { RuntimeThemeManifest } from "../types/lessonOperational";
import healthManifest from "../data/themes/health.meta.json";
import mentalManifest from "../data/themes/mental.meta.json";
import moneyManifest from "../data/themes/money.meta.json";
import socialManifest from "../data/themes/social.meta.json";
import studyManifest from "../data/themes/study.meta.json";
import workManifest from "../data/themes/work.meta.json";

const THEME_MANIFESTS: Record<string, RuntimeThemeManifest> = {
  health: healthManifest as RuntimeThemeManifest,
  mental: mentalManifest as RuntimeThemeManifest,
  money: moneyManifest as RuntimeThemeManifest,
  social: socialManifest as RuntimeThemeManifest,
  study: studyManifest as RuntimeThemeManifest,
  work: workManifest as RuntimeThemeManifest,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getRuntimeThemeManifest(themeId: string): RuntimeThemeManifest | null {
  return THEME_MANIFESTS[themeId] ?? null;
}

export function isThemeReviewOverdue(manifest: RuntimeThemeManifest | null, nowMs = Date.now()): boolean {
  if (!manifest?.last_reviewed_at || typeof manifest.review_cycle_days !== "number") {
    return false;
  }

  const reviewedAt = Date.parse(manifest.last_reviewed_at);
  if (Number.isNaN(reviewedAt)) {
    return false;
  }

  return reviewedAt + manifest.review_cycle_days * MS_PER_DAY <= nowMs;
}

export function areThemeDependenciesSatisfied(
  manifest: RuntimeThemeManifest | null,
  completedThemeIds: string[]
): boolean {
  if (!manifest?.prerequisite_themes || manifest.prerequisite_themes.length === 0) {
    return true;
  }

  const completedThemeSet = new Set(completedThemeIds);
  return manifest.prerequisite_themes.every((themeId) => completedThemeSet.has(themeId));
}
