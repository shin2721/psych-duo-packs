import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Analytics } from "../../analytics";
import type { PersonalizationConfig, PersonalizationSegment } from "../../gamificationConfig";
import type { QuestInstance } from "../../questDefinitions";
import { warnDev } from "../../devLog";
import { adjustQuestNeedsBySegment } from "../progressionQuests";
import { assignPersonalizationSegment as runPersonalizationAssignment } from "./progressionPersonalization";
import type { ProgressionRefs } from "./useProgressionRefs";

export function useProgressionPersonalizationEffects(args: {
  isStateHydrated: boolean;
  lastActivityDate: string | null;
  personalizationConfig: PersonalizationConfig;
  refs: ProgressionRefs;
  setPersonalizationAssignedAtMs: Dispatch<SetStateAction<number | null>>;
  setPersonalizationSegment: Dispatch<SetStateAction<PersonalizationSegment>>;
  setQuests: Dispatch<SetStateAction<QuestInstance[]>>;
  streak: number;
  userId?: string | null;
}): void {
  const assignPersonalizationSegment = useCallback(async () => {
    const assignment = await runPersonalizationAssignment({
      userId: args.userId,
      enabled: args.personalizationConfig.enabled,
      cooldownHours: args.personalizationConfig.segment_reassign_cooldown_hours,
      currentSegment: args.refs.personalizationSegmentRef.current,
      lastActivityDate: args.lastActivityDate,
      lastAssignedAtMs: args.refs.personalizationAssignedAtMsRef.current,
      streak: args.streak,
      nowMs: Date.now(),
    });
    if (!assignment.shouldAssign) return;

    if (assignment.loadFailed && __DEV__) {
      warnDev("[Personalization] Failed to fetch 7d lesson counts:");
    }

    args.refs.personalizationAssignedAtMsRef.current = assignment.nextAssignedAtMs;
    args.setPersonalizationAssignedAtMs(assignment.nextAssignedAtMs);

    if (!assignment.segmentChanged && args.refs.personalizationSegmentRef.current === assignment.nextSegment) {
      return;
    }

    args.refs.personalizationSegmentRef.current = assignment.nextSegment;
    args.setPersonalizationSegment(assignment.nextSegment);
    args.setQuests((prev) => {
      const adjusted = adjustQuestNeedsBySegment(prev, assignment.nextSegment);
      args.refs.questsRef.current = adjusted;
      return adjusted;
    });

    Analytics.track("personalization_segment_assigned", {
      segment: assignment.nextSegment,
      lessonsCompleted7d: assignment.lessonsCompleted7d,
      daysSinceStudy: assignment.daysSinceStudy,
      source: "daily_reassign",
    });
  }, [
    args.lastActivityDate,
    args.personalizationConfig,
    args.refs,
    args.setPersonalizationAssignedAtMs,
    args.setPersonalizationSegment,
    args.setQuests,
    args.streak,
    args.userId,
  ]);

  useEffect(() => {
    if (!args.userId || !args.isStateHydrated || !args.personalizationConfig.enabled) return;
    assignPersonalizationSegment().catch((error) => {
      warnDev("[Personalization] Initial segment assignment failed:", error);
    });
    const interval = setInterval(() => {
      assignPersonalizationSegment().catch((error) => {
        warnDev("[Personalization] Segment reassignment failed:", error);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [args.isStateHydrated, args.personalizationConfig.enabled, args.userId, assignPersonalizationSegment]);
}
