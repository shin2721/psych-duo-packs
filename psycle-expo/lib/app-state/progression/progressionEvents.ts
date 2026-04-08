import {
  applyEventMetricProgress,
  reconcileEventStateOnAccess,
  type EventCampaignState,
  type EventQuestInstance,
} from "../../eventCampaign";
import type { EventCampaignConfig, EventQuestMetric } from "../../gamificationConfig";

export function reconcileEventCampaignState(args: {
  previousState: EventCampaignState | null;
  activeConfig: EventCampaignConfig | null;
  liveOpsActivationId: string | null;
  now?: Date;
}): {
  nextState: EventCampaignState | null;
  nextLiveOpsActivationId: string | null;
  activatedEventId: string | null;
} {
  if (!args.activeConfig) {
    return {
      nextState: null,
      nextLiveOpsActivationId: null,
      activatedEventId: null,
    };
  }

  const nextState = reconcileEventStateOnAccess(
    args.previousState,
    args.activeConfig,
    args.now ?? new Date()
  );
  const activatedEventId =
    args.liveOpsActivationId !== args.activeConfig.id ? args.activeConfig.id : null;

  return {
    nextState,
    nextLiveOpsActivationId: args.activeConfig.id,
    activatedEventId,
  };
}

export function progressEventCampaignMetric(args: {
  previousState: EventCampaignState | null;
  activeConfig: EventCampaignConfig;
  metric: EventQuestMetric;
  step: number;
  now?: Date;
}): {
  nextState: EventCampaignState;
  rewardedQuests: EventQuestInstance[];
  rewardedGems: number;
  startedNow: boolean;
  completedNow: boolean;
} {
  const reconciled = reconcileEventStateOnAccess(
    args.previousState,
    args.activeConfig,
    args.now ?? new Date()
  );
  const progressed = applyEventMetricProgress(reconciled, args.metric, args.step);

  const rewardedQuests: EventQuestInstance[] = [];
  let rewardedGems = 0;
  let nextStarted = progressed.started;
  let nextCompleted = progressed.completed;
  let startedNow = false;
  let completedNow = false;

  const nextQuests = progressed.quests.map((quest) => {
    if (quest.progress >= quest.need && !quest.claimed) {
      const claimedQuest: EventQuestInstance = { ...quest, claimed: true };
      rewardedQuests.push(claimedQuest);
      rewardedGems += claimedQuest.rewardGems;
      return claimedQuest;
    }
    return quest;
  });

  if (!nextStarted && nextQuests.some((quest) => quest.progress > 0)) {
    nextStarted = true;
    startedNow = true;
  }

  if (!nextCompleted && nextQuests.length > 0 && nextQuests.every((quest) => quest.claimed)) {
    nextCompleted = true;
    completedNow = true;
  }

  return {
    nextState: {
      ...progressed,
      started: nextStarted,
      completed: nextCompleted,
      quests: nextQuests,
    },
    rewardedQuests,
    rewardedGems,
    startedNow,
    completedNow,
  };
}
