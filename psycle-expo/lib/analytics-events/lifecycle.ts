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

export type OnboardingStartEvent = {
  name: "onboarding_start";
  properties: {};
};

export type OnboardingCompleteEvent = {
  name: "onboarding_complete";
  properties: {};
};

export type LessonStartEvent = {
  name: "lesson_start";
  properties: { lessonId: string; genreId: string };
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
  | OnboardingStartEvent
  | OnboardingCompleteEvent
  | LessonStartEvent
  | LessonCompleteEvent
  | QuestionIncorrectEvent
  | NotificationPermissionResultEvent
  | ReminderScheduledEvent
  | ReminderOpenedEvent
  | MistakesHubSessionStartedEvent
  | MistakesHubSessionCompletedEvent;
