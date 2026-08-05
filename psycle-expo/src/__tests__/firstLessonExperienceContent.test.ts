import mentalLesson from "../../data/lessons/mental_units/mental_l01.ja.json";
import { getLessonRuntimeMetadata } from "../../lib/lesson-data/lessonMetadata";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("first lesson experience content", () => {
  test("keeps one coherent first-lesson asset without freezing its interaction design", () => {
    expect(mentalLesson.length).toBeGreaterThan(0);
    expect(new Set(mentalLesson.map((question) => question.id)).size).toBe(mentalLesson.length);
    expect(mentalLesson.every((question) => question.id.startsWith("mental_l01_"))).toBe(true);
  });

  test("surfaces the authored final action as the completion takeaway", () => {
    const metadata = getLessonRuntimeMetadata("mental_l01");
    const recapAction = resolveCompletionRecapAction(
      mentalLesson as Question[],
      "fallback",
      metadata?.takeaway_action
    );
    const finalQuestion = mentalLesson[mentalLesson.length - 1];

    expect(recapAction).toBe(metadata?.takeaway_action);
    expect(
      [finalQuestion?.actionable_advice, finalQuestion?.expanded_details?.try_this]
    ).toContain(metadata?.takeaway_action);
    expect(JSON.stringify(mentalLesson)).not.toContain("編張");
  });

  test("keeps every Unit 0 card on its verified source instead of a placeholder", () => {
    expect(mentalLesson.map((question) => question.source_id)).toEqual([
      "Flynn_Lake_2008",
      "Ranehill_2015",
      "Jamieson_2010_GRE",
      "Kappes_Oettingen_2011",
      "Gollwitzer_Brandstaetter_1997",
    ]);
    expect(
      mentalLesson.every((question) => !question.source_id.startsWith("Psycle_Unverified_"))
    ).toBe(true);
  });
});
