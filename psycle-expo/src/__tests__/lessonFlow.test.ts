jest.mock("../../lib/streaks", () => ({
  XP_REWARDS: { CORRECT_ANSWER: 10, LESSON_COMPLETE: 50 },
  addXP: jest.fn(),
  recordStudyCompletion: jest.fn(),
}));
jest.mock("../../lib/onboarding", () => ({
  hasCompletedFirstLesson: jest.fn(),
  markFirstLessonComplete: jest.fn(),
}));
jest.mock("../../lib/notifications", () => ({
  syncDailyReminders: jest.fn(() => Promise.resolve()),
}));
jest.mock("../../lib/analytics", () => ({
  Analytics: { track: jest.fn() },
}));
jest.mock("../../lib/lesson/lessonAnalytics", () => ({
  getLessonGenreId: jest.fn(() => "mental"),
  trackComboXpBonusApplied: jest.fn(),
  trackLessonComplete: jest.fn(),
  trackLessonStart: jest.fn(),
  trackQuestionIncorrect: jest.fn(),
}));

import {
  resolveLessonAnswerTransition,
  getLessonReminderSyncPayload,
} from "../../lib/lesson/useLessonFlow";
import { Analytics } from "../../lib/analytics";
import { completeLessonSession } from "../../lib/lesson/lessonFlowCompletion";
import { hasCompletedFirstLesson } from "../../lib/onboarding";
import type { Question } from "../../types/question";

const question: Question = {
  id: "q1",
  type: "multiple_choice",
  question: "質問",
  choices: ["A", "B"],
  correct_index: 0,
  difficulty: "easy",
  xp: 10,
};

describe("lesson flow helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hasCompletedFirstLesson as jest.Mock).mockResolvedValue(false);
  });

  test("incorrect answer を review queue に積む", () => {
    const transition = resolveLessonAnswerTransition({
      currentIndex: 0,
      isCorrect: false,
      isReviewRound: false,
      originalQuestions: [question, { ...question, id: "q2" }],
      question,
      questions: [question, { ...question, id: "q2" }],
      reviewQueue: [],
    });

    expect(transition.nextReviewQueue).toEqual([question]);
    expect(transition.shouldComplete).toBe(false);
    expect(transition.nextCurrentIndex).toBe(1);
  });

  test("本編終了時は review round へ遷移する", () => {
    const transition = resolveLessonAnswerTransition({
      currentIndex: 1,
      isCorrect: true,
      isReviewRound: false,
      originalQuestions: [question, { ...question, id: "q2" }],
      question: { ...question, id: "q2" },
      questions: [question, { ...question, id: "q2" }],
      reviewQueue: [question],
    });

    expect(transition.nextIsReviewRound).toBe(true);
    expect(transition.nextCurrentIndex).toBe(0);
    expect(transition.nextQuestions).toEqual([question]);
    expect(transition.nextReviewQueue).toEqual([]);
  });

  test("review round 終了時は complete になる", () => {
    const transition = resolveLessonAnswerTransition({
      currentIndex: 0,
      isCorrect: true,
      isReviewRound: true,
      originalQuestions: [question],
      question,
      questions: [question],
      reviewQueue: [],
    });

    expect(transition.shouldComplete).toBe(true);
  });

  test("reminder sync payload は user なしで null、user ありで object を返す", () => {
    expect(
      getLessonReminderSyncPayload({
        energy: 3,
        energyRefillMinutes: 15,
        hasPendingDailyQuests: true,
        isSubscriptionActive: false,
        lastEnergyUpdateTime: null,
        maxEnergy: 5,
        streakRepairOffer: null,
      })
    ).toBeNull();

    expect(
      getLessonReminderSyncPayload({
        userId: "user-1",
        energy: 3,
        energyRefillMinutes: 15,
        hasPendingDailyQuests: true,
        isSubscriptionActive: false,
        lastEnergyUpdateTime: null,
        maxEnergy: 5,
        streakRepairOffer: null,
      })
    ).toEqual({
      userId: "user-1",
      energy: 3,
      energyRefillMinutes: 15,
      hasPendingDailyQuests: true,
      isSubscriptionActive: false,
      lastEnergyUpdateTime: null,
      maxEnergy: 5,
      streakRepairOffer: null,
    });
  });

  test("初回 lesson 完了は onboarding_first_lesson_completed を一度だけ計測する", async () => {
    await completeLessonSession({
      claimComebackRewardOnLessonComplete: jest.fn(),
      completeLesson: jest.fn(),
      energy: 3,
      energyRefillMinutes: 15,
      fileParam: "mental_l01",
      incrementQuestMetric: jest.fn(),
      isSubscriptionActive: false,
      lastEnergyUpdateTime: null,
      lessonCompleteTrackedRef: { current: null },
      maxEnergy: 5,
      quests: [],
      setIsComplete: jest.fn(),
      streakRepairOffer: null,
      userId: "user-1",
    });

    expect(Analytics.track).toHaveBeenCalledWith("onboarding_first_lesson_completed", {
      genreId: "mental",
      lessonId: "mental_l01",
      source: "lesson_complete",
    });

    jest.clearAllMocks();
    (hasCompletedFirstLesson as jest.Mock).mockResolvedValue(true);

    await completeLessonSession({
      claimComebackRewardOnLessonComplete: jest.fn(),
      completeLesson: jest.fn(),
      energy: 3,
      energyRefillMinutes: 15,
      fileParam: "mental_l02",
      incrementQuestMetric: jest.fn(),
      isSubscriptionActive: false,
      lastEnergyUpdateTime: null,
      lessonCompleteTrackedRef: { current: null },
      maxEnergy: 5,
      quests: [],
      setIsComplete: jest.fn(),
      streakRepairOffer: null,
      userId: "user-1",
    });

    expect(Analytics.track).not.toHaveBeenCalledWith(
      "onboarding_first_lesson_completed",
      expect.any(Object)
    );
  });
});
