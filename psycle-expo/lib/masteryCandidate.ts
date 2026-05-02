import type { MasteryCandidate, MasteryThemeState } from "./app-state/types";
import { lessonSetHasResolvedId } from "./lessonContinuity";

type TrailLikeNode = {
  lessonFile?: string;
  type?: string;
};

function isCoreUnitCompleted(
  currentTrail: TrailLikeNode[],
  completedLessons: Set<string>
): boolean {
  const coreLessonFiles = currentTrail
    .filter((node) => node.lessonFile && node.type !== "review_blackhole")
    .map((node) => node.lessonFile as string);

  if (coreLessonFiles.length === 0) return false;
  return coreLessonFiles.every((lessonFile) => lessonSetHasResolvedId(completedLessons, lessonFile));
}

export function selectMasteryCandidate(args: {
  themeId: string;
  currentTrail: TrailLikeNode[];
  completedLessons: Set<string>;
  masteryThemeState: MasteryThemeState | null;
}): MasteryCandidate | null {
  const { masteryThemeState } = args;
  if (!masteryThemeState) return null;
  if (!isCoreUnitCompleted(args.currentTrail, args.completedLessons)) return null;
  if (masteryThemeState.graduationState === "graduated") return null;
  if (masteryThemeState.masteryCeilingState === "ceiling_reached") return null;

  const activeSlotsRemaining = Math.max(
    0,
    masteryThemeState.maxActiveSlots - masteryThemeState.activeVariantIds.length
  );
  if (activeSlotsRemaining <= 0) return null;

  const nextLessonId = masteryThemeState.activeVariantIds.find(
    (variantId) => !lessonSetHasResolvedId(args.completedLessons, variantId)
  );

  return {
    themeId: args.themeId,
    lessonId: nextLessonId,
    activeSlotsRemaining,
    graduationState: masteryThemeState.graduationState,
    masteryCeilingState: masteryThemeState.masteryCeilingState,
  };
}
