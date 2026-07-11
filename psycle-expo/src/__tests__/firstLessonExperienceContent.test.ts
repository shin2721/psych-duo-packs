import mentalLesson from "../../data/lessons/mental_units/mental_l01.ja.json";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("first lesson experience content", () => {
  test("keeps the cognitive appraisal swipe answer aligned with the explanation", () => {
    const question = mentalLesson.find((item) => item.id === "mental_l01_003");

    expect(question).toMatchObject({
      type: "swipe_judgment",
      is_true: false,
    });
    expect(question?.swipe_labels?.left).toContain("解釈");
    expect(question?.swipe_labels?.right).toContain("出来事");
    expect(question?.explanation).toContain("出来事以外");
    expect(question?.explanation).toContain("見直せる");
  });

  test("surfaces the practical intervention as the completion takeaway", () => {
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toContain("心臓");
    expect(recapAction).toContain("準備");
    expect(recapAction).toContain("10秒");
    expect(JSON.stringify(mentalLesson)).not.toContain("編張");
  });
});
