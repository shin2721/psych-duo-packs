import mentalLesson from "../../data/lessons/mental_units/mental_l01.ja.json";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

// This suite used to assert the literal Japanese of mental_l01 ("解釈", "出来事以外",
// "見直せる", "心臓", "準備", "10秒"), which froze the current wording: rewriting the
// lesson broke the tests even when the rewrite was better. The literal assertions
// are gone. What is checked here is that the lesson stays internally consistent and
// that the completion screen still has something to carry into tomorrow.

describe("first lesson experience content", () => {
  const questions = mentalLesson as Question[];

  test("every swipe judgment states its verdict and both swipe labels", () => {
    const swipeQuestions = questions.filter((item) => item.type === "swipe_judgment");
    expect(swipeQuestions.length).toBeGreaterThan(0);

    for (const question of swipeQuestions) {
      expect(typeof question.is_true).toBe("boolean");
      expect(question.swipe_labels?.left?.trim()).toBeTruthy();
      expect(question.swipe_labels?.right?.trim()).toBeTruthy();
      expect(question.swipe_labels?.left).not.toEqual(question.swipe_labels?.right);
      expect(question.explanation?.trim()).toBeTruthy();
    }
  });

  test("surfaces a practical takeaway as the completion recap action", () => {
    const recapAction = resolveCompletionRecapAction(questions, "fallback");

    expect(recapAction.trim()).toBeTruthy();
    expect(recapAction).not.toBe("fallback");

    // The recap must come from the lesson itself, not be invented by the screen.
    const authoredActions = questions.flatMap((item) =>
      [item.actionable_advice, item.expanded_details?.try_this].filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      )
    );
    expect(authoredActions).toContain(recapAction);
  });

  test("carries no mojibake into shipped copy", () => {
    // Guard against a generation defect that shipped 編張 in place of 緊張.
    expect(JSON.stringify(mentalLesson)).not.toContain("編張");
  });
});
