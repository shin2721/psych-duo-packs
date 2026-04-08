import { useMemo } from "react";
import type { EventCampaignState, EventQuestInstance } from "../../eventCampaign";
import type { QuestInstance } from "../../questDefinitions";
import { getActiveEventCampaignConfig } from "../progressionLiveOps";
import type { EventCampaignSummary, ProgressionState } from "../types";

function buildEventCampaignSummary(
  eventCampaignState: EventCampaignState | null
): { eventCampaign: EventCampaignSummary | null; eventQuests: EventQuestInstance[] } {
  const activeEventConfig = getActiveEventCampaignConfig(new Date());
  const matchingEventCampaignState =
    activeEventConfig && eventCampaignState?.eventId === activeEventConfig.id ? eventCampaignState : null;

  const eventCampaign: EventCampaignSummary | null =
    activeEventConfig && matchingEventCampaignState
      ? {
          id: activeEventConfig.id,
          titleKey: activeEventConfig.title_key,
          communityTargetLessons: activeEventConfig.community_target_lessons,
          startAt: activeEventConfig.start_at,
          endAt: activeEventConfig.end_at,
        }
      : null;

  return {
    eventCampaign,
    eventQuests: matchingEventCampaignState ? matchingEventCampaignState.quests : [],
  };
}

export function useProgressionValue(
  params: Omit<ProgressionState, "eventCampaign" | "eventQuests" | "hasPendingDailyQuests"> & {
    eventCampaignState: EventCampaignState | null;
    quests: QuestInstance[];
  }
): ProgressionState {
  const { eventCampaignState, quests, ...rest } = params;

  return useMemo(() => {
    const { eventCampaign, eventQuests } = buildEventCampaignSummary(eventCampaignState);
    const hasPendingDailyQuests = quests.some((quest) => quest.type === "daily" && quest.progress < quest.need);

    return {
      ...rest,
      quests,
      eventCampaign,
      eventQuests,
      hasPendingDailyQuests,
    };
  }, [eventCampaignState, quests, rest]);
}
