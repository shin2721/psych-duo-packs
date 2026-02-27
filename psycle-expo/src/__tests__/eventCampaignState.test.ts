import {
  buildInitialEventState,
  isEventWindowActive,
  normalizeEventCampaignState,
  reconcileEventStateOnAccess,
  type EventCampaignState,
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
      template_id: "ev_streak5_5",
      metric: "streak5_milestone",
      need: 5,
      reward_gems: 30,
      title_key: "events.spring2026.quest_streak5_5",
    },
  ],
};

describe("eventCampaign state", () => {
  test("eventId が変わったら新しいイベント状態で再生成される", () => {
    const oldState: EventCampaignState = {
      eventId: "old_event",
      started: true,
      completed: true,
      quests: [
        {
          id: "ev_old",
          templateId: "ev_old",
          metric: "lesson_complete",
          need: 10,
          progress: 10,
          rewardGems: 10,
          claimed: true,
          titleKey: "events.old.title",
        },
      ],
    };

    const reconciled = reconcileEventStateOnAccess(oldState, BASE_CONFIG);
    expect(reconciled.eventId).toBe(BASE_CONFIG.id);
    expect(reconciled.started).toBe(false);
    expect(reconciled.completed).toBe(false);
    expect(reconciled.quests).toHaveLength(2);
    expect(reconciled.quests.every((quest) => quest.progress === 0)).toBe(true);
  });

  test("既存stateの正規化で不正値を補正し、進捗をneedでクランプする", () => {
    const raw = {
      eventId: BASE_CONFIG.id,
      started: true,
      completed: false,
      quests: [
        {
          id: "ev_lessons_20",
          templateId: "ev_lessons_20",
          metric: "lesson_complete",
          need: 20,
          progress: 99,
          rewardGems: 20,
          claimed: false,
          titleKey: "events.spring2026.quest_lessons_20",
        },
      ],
    };

    const normalized = normalizeEventCampaignState(raw);
    expect(normalized).not.toBeNull();
    expect(normalized?.quests[0].progress).toBe(20);
  });

  test("期限外は isEventWindowActive が false を返す", () => {
    const before = new Date("2026-04-28T10:00:00+09:00");
    const during = new Date("2026-05-02T10:00:00+09:00");
    const after = new Date("2026-05-07T10:00:00+09:00");
    expect(isEventWindowActive(before, BASE_CONFIG)).toBe(false);
    expect(isEventWindowActive(during, BASE_CONFIG)).toBe(true);
    expect(isEventWindowActive(after, BASE_CONFIG)).toBe(false);
  });

  test("state が無い場合は初期状態を生成する", () => {
    const rebuilt = reconcileEventStateOnAccess(null, BASE_CONFIG);
    const initial = buildInitialEventState(BASE_CONFIG);
    expect(rebuilt).toEqual(initial);
  });
});
