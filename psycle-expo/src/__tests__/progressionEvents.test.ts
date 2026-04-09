import { buildInitialEventState } from "../../lib/eventCampaign";
import type { EventCampaignConfig } from "../../lib/gamificationConfig";
import { progressEventCampaignMetric, reconcileEventCampaignState } from "../../lib/app-state/progression/progressionEvents";

const TEST_EVENT: EventCampaignConfig = {
  enabled: true,
  id: "spring_challenge_2026",
  start_at: "2026-04-01T00:00:00+09:00",
  end_at: "2026-04-30T23:59:59+09:00",
  title_key: "events.spring2026.title",
  community_target_lessons: 100,
  reward_badge_id: "event_spring_2026",
  quests: [
    {
      template_id: "ev_lessons_1",
      metric: "lesson_complete",
      need: 1,
      reward_gems: 20,
      title_key: "events.spring.quest",
    },
  ],
};

describe("progressionEvents", () => {
  test("reconcileEventCampaignState clears state when no active config", () => {
    const result = reconcileEventCampaignState({
      previousState: buildInitialEventState(TEST_EVENT),
      activeConfig: null,
      liveOpsActivationId: TEST_EVENT.id,
    });

    expect(result).toEqual({
      nextState: null,
      nextLiveOpsActivationId: null,
      activatedEventId: null,
    });
  });

  test("progressEventCampaignMetric starts, rewards, and completes event quests", () => {
    const result = progressEventCampaignMetric({
      previousState: null,
      activeConfig: TEST_EVENT,
      metric: "lesson_complete",
      step: 1,
      now: new Date("2026-04-10T12:00:00+09:00"),
    });

    expect(result.startedNow).toBe(true);
    expect(result.completedNow).toBe(true);
    expect(result.rewardedGems).toBe(20);
    expect(result.rewardedQuests).toHaveLength(1);
    expect(result.nextState.started).toBe(true);
    expect(result.nextState.completed).toBe(true);
    expect(result.nextState.quests[0]).toMatchObject({
      progress: 1,
      claimed: true,
    });
  });
});
