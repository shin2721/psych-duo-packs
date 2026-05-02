import { XP_REWARDS, addXP, recordStudyCompletion } from "../streaks";
import { hasCompletedFirstLesson, markFirstLessonComplete } from "../onboarding";
import type { QuestInstance, QuestMetric } from "../questDefinitions";
import { getLessonCompletionQuestIncrements } from "../questProgressRules";
import { syncDailyReminders } from "../notifications";
import type { StreakRepairOffer } from "../streakRepair";
import { Analytics } from "../analytics";
import { getLessonGenreId, trackLessonComplete } from "./lessonAnalytics";
import { getLessonReminderSyncPayload } from "./lessonFlowHelpers";
import { warnDev } from "../devLog";

interface CompleteLessonSessionParams {
  claimComebackRewardOnLessonComplete: () => void;
  completeLesson: (lessonId: string) => void;
  energy: number;
  energyRefillMinutes: number;
  fileParam: string;
  incrementQuestMetric: (metric: QuestMetric, step?: number) => void;
  isSubscriptionActive: boolean;
  lastEnergyUpdateTime: number | null;
  lessonCompleteTrackedRef: { current: string | null };
  maxEnergy: number;
  quests: QuestInstance[];
  setIsComplete: (value: boolean) => void;
  streakRepairOffer: StreakRepairOffer | null;
  userId?: string;
}

export async function completeLessonSession(
  params: CompleteLessonSessionParams
): Promise<void> {
  params.completeLesson(params.fileParam);
  const firstLessonAlreadyCompleted = await hasCompletedFirstLesson();
  await markFirstLessonComplete();

  if (!firstLessonAlreadyCompleted) {
    Analytics.track("onboarding_first_lesson_completed", {
      lessonId: params.fileParam,
      genreId: getLessonGenreId(params.fileParam),
      source: "lesson_complete",
    });
  }

  for (const questIncrement of getLessonCompletionQuestIncrements()) {
    params.incrementQuestMetric(questIncrement.metric, questIncrement.step);
  }

  await recordStudyCompletion();
  await addXP(XP_REWARDS.LESSON_COMPLETE);
  params.claimComebackRewardOnLessonComplete();

  const reminderPayload = getLessonReminderSyncPayload({
    userId: params.userId,
    hasPendingDailyQuests: params.quests.some(
      (quest) => quest.type === "daily" && quest.progress < quest.need
    ),
    streakRepairOffer: params.streakRepairOffer,
    energy: params.energy,
    maxEnergy: params.maxEnergy,
    lastEnergyUpdateTime: params.lastEnergyUpdateTime,
    energyRefillMinutes: params.energyRefillMinutes,
    isSubscriptionActive: params.isSubscriptionActive,
  });

  if (reminderPayload) {
    syncDailyReminders(reminderPayload).catch((error) => {
      warnDev("[Notifications] Failed to sync reminders from lesson:", error);
    });
  }

  if (params.lessonCompleteTrackedRef.current !== params.fileParam) {
    params.lessonCompleteTrackedRef.current = params.fileParam;
    trackLessonComplete(params.fileParam);
  }

  params.setIsComplete(true);
}
