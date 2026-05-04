import mentalLesson from "../../data/lessons/mental_units/mental_l01.ja.json";
import { resolveCompletionRecapAction } from "../../lib/lessonCompletionRecap";
import type { Question } from "../../types/question";

describe("first lesson experience content", () => {
  test("keeps the cognitive appraisal swipe answer aligned with the explanation", () => {
    const question = mentalLesson.find((item) => item.id === "mental_l01_003");

    expect(question).toMatchObject({
      type: "swipe_judgment",
      is_true: false,
      swipe_labels: {
        left: "解釈にある",
        right: "出来事にある",
      },
    });
    expect(question?.explanation).toContain("解釈");
    expect(question?.explanation).toContain("介入余地");
  });

  test("surfaces the practical intervention as the completion takeaway", () => {
    const recapAction = resolveCompletionRecapAction(mentalLesson as Question[], "fallback");

    expect(recapAction).toBe("👉 次に心臓がドキドキしたら → 「体が準備運動してる」と10秒だけ唱える");
    expect(JSON.stringify(mentalLesson)).not.toContain("編張");
  });
});
