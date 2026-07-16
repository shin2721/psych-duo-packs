import { resolveIncorrectFeedbackHint } from "../../lib/lesson/incorrectFeedbackHint";
import {
  adaptRawQuestion,
  createLessonLoadDiagnostics,
} from "../../lib/lesson-data/lessonQuestionAdapter";
import type { Question } from "../../types/question";

function buildQuestion(overrides: Partial<Question> = {}): Question {
  return {
    type: "multiple_choice",
    question: "question",
    choices: ["a", "b"],
    correct_index: 0,
    difficulty: "medium",
    xp: 5,
    ...overrides,
  };
}

describe("question result feedback", () => {
  test("prefers an authored correction hint over the generic evidence hint", () => {
    expect(
      resolveIncorrectFeedbackHint(
        buildQuestion({ feedback_prompt: "録画に残る事実へ戻る" }),
        "多くの人に起きやすい傾向"
      )
    ).toBe("録画に残る事実へ戻る");
  });

  test("falls back for legacy questions without an authored hint", () => {
    expect(
      resolveIncorrectFeedbackHint(buildQuestion(), "既存の汎用ヒント")
    ).toBe("既存の汎用ヒント");
  });

  test("preserves an authored hint while adapting lesson JSON for runtime", () => {
    const adapted = adaptRawQuestion(
      {
        id: "mental_l02_002",
        type: "multiple_choice",
        question: "録画に残る事実は？",
        choices: ["事実", "意味"],
        correct_index: 0,
        feedback_prompt: "録画に残る事実へ戻る",
        difficulty: "medium",
        xp: 5,
      },
      createLessonLoadDiagnostics()
    );

    expect(adapted?.feedback_prompt).toBe("録画に残る事実へ戻る");
  });
});
