import {
  DAILY_QUEST_TEMPLATES,
  MONTHLY_FIXED_QUEST_TEMPLATES,
  WEEKLY_QUEST_TEMPLATES,
} from "../../lib/questTemplates";

function rewardPerUnit(template: { need: number; rewardXp: number }) {
  return template.rewardXp / Math.max(1, template.need);
}

describe("reward economy guardrails", () => {
  test("daily lesson quests stay short-session compatible", () => {
    const dailyLessonQuests = DAILY_QUEST_TEMPLATES.filter(
      (template) => template.metric === "lesson_complete"
    );

    expect(dailyLessonQuests.length).toBeGreaterThan(0);
    for (const template of dailyLessonQuests) {
      expect(template.need).toBeLessThanOrEqual(5);
      expect(rewardPerUnit(template)).toBeLessThanOrEqual(10);
    }
  });

  test("weekly lesson quests reward consistency without outpaying the daily loop", () => {
    const weeklyLessonQuests = WEEKLY_QUEST_TEMPLATES.filter(
      (template) => template.metric === "lesson_complete"
    );

    expect(weeklyLessonQuests.length).toBeGreaterThan(0);
    for (const template of weeklyLessonQuests) {
      expect(template.need).toBeGreaterThanOrEqual(8);
      expect(rewardPerUnit(template)).toBeLessThanOrEqual(10);
    }
  });

  test("streak quests reward milestones without dominating lesson completion", () => {
    const streakQuests = [...DAILY_QUEST_TEMPLATES, ...WEEKLY_QUEST_TEMPLATES].filter(
      (template) => template.metric === "streak5_milestone"
    );

    expect(streakQuests.length).toBeGreaterThan(0);
    for (const template of streakQuests) {
      expect(rewardPerUnit(template)).toBeLessThanOrEqual(25);
    }
  });

  test("monthly quests are capped as long-horizon rewards", () => {
    for (const template of MONTHLY_FIXED_QUEST_TEMPLATES) {
      expect(template.rewardXp).toBeLessThanOrEqual(150);
      if (template.metric === "lesson_complete") {
        expect(template.need).toBeGreaterThanOrEqual(50);
        expect(rewardPerUnit(template)).toBeLessThanOrEqual(5);
      }
    }
  });
});
