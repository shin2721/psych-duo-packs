import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Analytics } from "../analytics";
import { warnDev } from "../devLog";

interface EventCampaignImpressionTarget {
  id: string;
  communityTargetLessons: number;
}

export function useQuestEventImpressions({
  eventCampaign,
  todayKey,
  userId,
}: {
  eventCampaign: EventCampaignImpressionTarget | null;
  todayKey: string;
  userId?: string | null;
}) {
  useEffect(() => {
    if (!eventCampaign) return;
    const storageUserId = userId ?? "local";
    const key = `event_campaign_impressions_${storageUserId}_${eventCampaign.id}`;

    const trackEventSectionShown = async () => {
      let nextState = {
        eventShownDate: null as string | null,
        communityGoalShownDate: null as string | null,
      };

      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<typeof nextState>;
          nextState = {
            eventShownDate:
              typeof parsed.eventShownDate === "string" ? parsed.eventShownDate : null,
            communityGoalShownDate:
              typeof parsed.communityGoalShownDate === "string"
                ? parsed.communityGoalShownDate
                : null,
          };
        }
      } catch (error) {
        warnDev("[EventCampaign] Failed to read impression state:", error);
      }

      let hasUpdate = false;

      if (nextState.eventShownDate !== todayKey) {
        Analytics.track("event_shown", {
          eventId: eventCampaign.id,
          source: "quests_tab",
        });
        nextState.eventShownDate = todayKey;
        hasUpdate = true;
      }

      if (nextState.communityGoalShownDate !== todayKey) {
        Analytics.track("community_goal_shown", {
          eventId: eventCampaign.id,
          targetLessons: eventCampaign.communityTargetLessons,
          source: "quests_tab",
        });
        nextState.communityGoalShownDate = todayKey;
        hasUpdate = true;
      }

      if (hasUpdate) {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(nextState));
        } catch (error) {
          warnDev("[EventCampaign] Failed to persist impression state:", error);
        }
      }
    };

    trackEventSectionShown().catch((error) => {
      warnDev("[EventCampaign] Failed to track impressions:", error);
    });
  }, [eventCampaign, todayKey, userId]);
}
