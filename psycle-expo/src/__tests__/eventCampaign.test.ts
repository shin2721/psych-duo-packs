import {
  applyEventMetricProgress,
  buildInitialEventState,
  isEventWindowActive,
} from "../../lib/eventCampaign";
import type { EventCampaignConfig } from "../../lib/gamificationConfig";

const BASE_CONFIG: EventCampaignConfig = {
  enabled: true,
  id: "spring_challenge_2026",
  start_at: "2026-04-29T00:00:00+09:00",
  end_at: "2026-05-06T23:59:59+09:00",
  title_key: "events.spring2026.title",
  community_target_lessons: 10000,
  reward_badge_id: "event_spring_2026",
  quests: [
    {
      template_id: "ev_lessons_20",
      metric: "lesson_complete",
      need: 20,
      reward_gems: 20,
      title_key: "events.spring2026.quest_lessons_20",
    },
    {
      template_id: "ev_streak5_10",
      metric: "streak5_milestone",
      need: 10,
      reward_gems: 30,
      title_key: "events.spring2026.quest_streak5_10",
    },
  ],
};

describe("eventCampaign", () => {
  test("enabled=false なら非アクティブ", () => {
    const config = { ...BASE_CONFIG, enabled: false };
    const now = new Date("2026-05-01T12:00:00+09:00");
    expect(isEventWindowActive(now, config)).toBe(false);
  });

  test("期間内ならアクティブ", () => {
    const now = new Date("2026-05-01T12:00:00+09:00");
    expect(isEventWindowActive(now, BASE_CONFIG)).toBe(true);
  });

  test("期間外なら非アクティブ", () => {
    const before = new Date("2026-04-28T23:59:59+09:00");
    const after = new Date("2026-05-07T00:00:00+09:00");
    expect(isEventWindowActive(before, BASE_CONFIG)).toBe(false);
    expect(isEventWindowActive(after, BASE_CONFIG)).toBe(false);
  });

  test("lesson_complete / streak5_milestone のみ進捗する", () => {
    const base = buildInitialEventState(BASE_CONFIG);
    const lessonUpdated = applyEventMetricProgress(base, "lesson_complete", 3);
    expect(lessonUpdated.quests.find((q) => q.metric === "lesson_complete")?.progress).toBe(3);
    expect(lessonUpdated.quests.find((q) => q.metric === "streak5_milestone")?.progress).toBe(0);

    const streakUpdated = applyEventMetricProgress(lessonUpdated, "streak5_milestone", 2);
    expect(streakUpdated.quests.find((q) => q.metric === "lesson_complete")?.progress).toBe(3);
    expect(streakUpdated.quests.find((q) => q.metric === "streak5_milestone")?.progress).toBe(2);
  });

  test("達成後 claimed=true になったクエストは再加算されない", () => {
    const base = buildInitialEventState(BASE_CONFIG);
    const nearGoal = {
      ...base,
      quests: base.quests.map((quest) =>
        quest.templateId === "ev_lessons_20"
          ? { ...quest, progress: 20, claimed: true }
          : quest
      ),
    };

    const next = applyEventMetricProgress(nearGoal, "lesson_complete", 5);
    const target = next.quests.find((quest) => quest.templateId === "ev_lessons_20");
    expect(target?.progress).toBe(20);
    expect(target?.claimed).toBe(true);
  });
});
