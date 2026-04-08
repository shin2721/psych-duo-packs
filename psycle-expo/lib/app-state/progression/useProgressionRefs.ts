import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import type { EventCampaignState } from "../../eventCampaign";
import type { PersonalizationSegment } from "../../gamificationConfig";
import type { QuestCycleKeys } from "../../questCycles";
import type { QuestInstance } from "../../questDefinitions";
import type { QuestRotationSelection } from "../../questRotation";
import type { ComebackRewardToastItem } from "../../comebackRewardToastQueue";
import type { StreakMilestoneToastItem } from "../../streakMilestoneToastQueue";

export interface ProgressionRefs {
  questsRef: MutableRefObject<QuestInstance[]>;
  questCycleKeysRef: MutableRefObject<QuestCycleKeys>;
  questRotationPrevRef: MutableRefObject<QuestRotationSelection>;
  eventCampaignStateRef: MutableRefObject<EventCampaignState | null>;
  personalizationSegmentRef: MutableRefObject<PersonalizationSegment>;
  personalizationAssignedAtMsRef: MutableRefObject<number | null>;
  liveOpsActivationRef: MutableRefObject<string | null>;
  badgeToastQueueRef: MutableRefObject<string[]>;
  streakMilestoneToastQueueRef: MutableRefObject<StreakMilestoneToastItem[]>;
  comebackRewardToastQueueRef: MutableRefObject<ComebackRewardToastItem[]>;
  claimedStreakMilestonesRef: MutableRefObject<number[]>;
}

export function useProgressionRefs(args: {
  quests: QuestInstance[];
  questCycleKeys: QuestCycleKeys;
  questRotationPrev: QuestRotationSelection;
  eventCampaignState: EventCampaignState | null;
  personalizationSegment: PersonalizationSegment;
  personalizationAssignedAtMs: number | null;
  badgeToastQueue: string[];
  streakMilestoneToastQueue: StreakMilestoneToastItem[];
  comebackRewardToastQueue: ComebackRewardToastItem[];
  claimedStreakMilestones: number[];
}): ProgressionRefs {
  const questsRef = useRef(args.quests);
  const questCycleKeysRef = useRef(args.questCycleKeys);
  const questRotationPrevRef = useRef(args.questRotationPrev);
  const eventCampaignStateRef = useRef(args.eventCampaignState);
  const personalizationSegmentRef = useRef(args.personalizationSegment);
  const personalizationAssignedAtMsRef = useRef(args.personalizationAssignedAtMs);
  const liveOpsActivationRef = useRef<string | null>(null);
  const badgeToastQueueRef = useRef(args.badgeToastQueue);
  const streakMilestoneToastQueueRef = useRef(args.streakMilestoneToastQueue);
  const comebackRewardToastQueueRef = useRef(args.comebackRewardToastQueue);
  const claimedStreakMilestonesRef = useRef(args.claimedStreakMilestones);

  useEffect(() => {
    questsRef.current = args.quests;
    questCycleKeysRef.current = args.questCycleKeys;
    questRotationPrevRef.current = args.questRotationPrev;
    eventCampaignStateRef.current = args.eventCampaignState;
    personalizationSegmentRef.current = args.personalizationSegment;
    personalizationAssignedAtMsRef.current = args.personalizationAssignedAtMs;
    badgeToastQueueRef.current = args.badgeToastQueue;
    streakMilestoneToastQueueRef.current = args.streakMilestoneToastQueue;
    comebackRewardToastQueueRef.current = args.comebackRewardToastQueue;
    claimedStreakMilestonesRef.current = args.claimedStreakMilestones;
  }, [
    args.badgeToastQueue,
    args.claimedStreakMilestones,
    args.comebackRewardToastQueue,
    args.eventCampaignState,
    args.personalizationAssignedAtMs,
    args.personalizationSegment,
    args.questCycleKeys,
    args.questRotationPrev,
    args.quests,
    args.streakMilestoneToastQueue,
  ]);

  return useMemo(
    () => ({
      questsRef,
      questCycleKeysRef,
      questRotationPrevRef,
      eventCampaignStateRef,
      personalizationSegmentRef,
      personalizationAssignedAtMsRef,
      liveOpsActivationRef,
      badgeToastQueueRef,
      streakMilestoneToastQueueRef,
      comebackRewardToastQueueRef,
      claimedStreakMilestonesRef,
    }),
    []
  );
}
