export type AppOpenEvent = {
  name: "app_open";
  properties: {};
};

export type SessionStartEvent = {
  name: "session_start";
  properties: {};
};

export type AppReadyEvent = {
  name: "app_ready";
  properties: {};
};

export type AppStartupPerformanceEvent = {
  name: "app_startup_performance";
  properties: {
    durationMs: number;
    source: "root_layout_ready";
  };
};

export type OnboardingStartEvent = {
  name: "onboarding_start";
  properties: {};
};

export type OnboardingCompleteEvent = {
  name: "onboarding_complete";
  properties: {};
};

export type OnboardingGenresSelectedEvent = {
  name: "onboarding_genres_selected";
  properties: {
    selectedGenres: string[];
    primaryGenreId: string;
    selectionCount: number;
    source: "onboarding_interests";
  };
};

export type OnboardingFirstLessonTargetedEvent = {
  name: "onboarding_first_lesson_targeted";
  properties: {
    genreId: string;
    lessonFile: string;
    source: "onboarding_interests";
  };
};

export type OnboardingFirstLessonCompletedEvent = {
  name: "onboarding_first_lesson_completed";
  properties: {
    lessonId: string;
    genreId: string;
    source: "lesson_complete";
  };
};

export type LessonStartEvent = {
  name: "lesson_start";
  properties: { lessonId: string; genreId: string };
};

export type LessonLoadPerformanceEvent = {
  name: "lesson_load_performance";
  properties: {
    durationMs: number;
    genreId?: string;
    lessonId?: string;
    pacingMode?: "first_session" | "support" | "steady" | "stretch";
    questionCount?: number;
    requestedLessonId?: string;
    source: "lesson_runtime";
    status: "loaded" | "energy_blocked" | "failed";
    targetDifficulty?: "easy" | "medium" | "hard";
  };
};

export type LessonCompleteEvent = {
  name: "lesson_complete";
  properties: { lessonId: string; genreId: string };
};

export type QuestionIncorrectEvent = {
  name: "question_incorrect";
  properties: {
    lessonId: string;
    genreId: string;
    questionId: string;
    questionType?: string;
    questionIndex?: number;
    isReviewRound?: boolean;
  };
};

export type NotificationPermissionResultEvent = {
  name: "notification_permission_result";
  properties: { status: "granted" | "denied"; source: "settings_toggle" | "bootstrap" };
};

export type ReminderScheduledEvent = {
  name: "reminder_scheduled";
  properties: {
    kind:
      | "streak_risk"
      | "daily_quest_deadline"
      | "league_demotion_risk"
      | "streak_broken"
      | "energy_recharged";
    scheduledAt: string;
    source: "sync_daily_reminders";
  };
};

export type ReminderOpenedEvent = {
  name: "reminder_opened";
  properties: {
    kind:
      | "streak_risk"
      | "daily_quest_deadline"
      | "league_demotion_risk"
      | "streak_broken"
      | "energy_recharged";
    source: "notification_tap";
  };
};

export type MistakesHubSessionStartedEvent = {
  name: "mistakes_hub_session_started";
  properties: { itemCount: number; source: "mistakes_hub_button" };
};

export type MistakesHubSessionCompletedEvent = {
  name: "mistakes_hub_session_completed";
  properties: { itemCount: number; clearedCount: number; source: "mistakes_hub_screen" };
};

export type LifecycleTrackedEvent =
  | AppOpenEvent
  | SessionStartEvent
  | AppReadyEvent
  | AppStartupPerformanceEvent
  | OnboardingStartEvent
  | OnboardingCompleteEvent
  | OnboardingGenresSelectedEvent
  | OnboardingFirstLessonTargetedEvent
  | OnboardingFirstLessonCompletedEvent
  | LessonStartEvent
  | LessonLoadPerformanceEvent
  | LessonCompleteEvent
  | QuestionIncorrectEvent
  | NotificationPermissionResultEvent
  | ReminderScheduledEvent
  | ReminderOpenedEvent
  | MistakesHubSessionStartedEvent
  | MistakesHubSessionCompletedEvent;
