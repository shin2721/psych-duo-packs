import { buildFirstWeekRetentionCue } from "../../lib/firstWeekRetention";

describe("first week retention cue", () => {
  test("appears after the first lesson and points to the next usable skill", () => {
    const cue = buildFirstWeekRetentionCue({
      completedLessonCount: 1,
      dailyGoal: 20,
      dailyXP: 5,
      nextLessonBody: "焦りを感じたら身体の反応としてラベルを貼る",
      nextLessonTitle: "焦りの扱い方",
    });

    expect(cue).toMatchObject({
      dayNumber: 2,
      reason: "first_week_next_skill",
      ctaLabel: "今日の印をつける",
    });
    expect(cue?.title).toContain("DAY 2/7");
    expect(cue?.body).toContain("焦りを感じたら身体の反応としてラベルを貼る");
  });

  test("switches to a low-pressure next-step preview after the daily goal is complete", () => {
    const cue = buildFirstWeekRetentionCue({
      completedLessonCount: 3,
      dailyGoal: 20,
      dailyXP: 20,
      nextLessonBody: "unused",
      nextLessonTitle: "反芻を止める",
    });

    expect(cue).toMatchObject({
      dayNumber: 4,
      reason: "first_week_goal_complete",
      ctaLabel: "続きだけ見る",
    });
    expect(cue?.body).toContain("反芻を止める");
  });

  test("does not compete with onboarding or post-week-one loops", () => {
    expect(
      buildFirstWeekRetentionCue({
        completedLessonCount: 0,
        dailyGoal: 20,
        dailyXP: 0,
        nextLessonTitle: "first",
      })
    ).toBeNull();
    expect(
      buildFirstWeekRetentionCue({
        completedLessonCount: 7,
        dailyGoal: 20,
        dailyXP: 0,
        nextLessonTitle: "stable",
      })
    ).toBeNull();
  });
});
