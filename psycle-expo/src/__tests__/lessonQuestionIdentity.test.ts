import moneyLesson from "../../data/lessons/money_units/money_l01.ja.json";
import { createQuestionRuntime } from "../../components/question-runtime/createQuestionRuntime";
import {
  adaptRawQuestion,
  createLessonLoadDiagnostics,
} from "../../lib/lesson-data/lessonQuestionAdapter";
import { loadLessons } from "../../lib/lessons";

describe("lesson question identity", () => {
  test("keeps question identity separate from research source identity", () => {
    const raw = moneyLesson[0];
    const question = adaptRawQuestion(raw, createLessonLoadDiagnostics());

    expect(question?.id).toBe(raw.id);
    expect(question?.source_id).toBe(raw.source_id);
    expect(question?.source_id).not.toBe(question?.id);
    expect(question?.difficulty).toBe(raw.difficulty);
    expect(question?.xp).toBe(raw.xp);
  });

  test("keeps a no-answer conversation neutral after adaptation", () => {
    const question = adaptRawQuestion(moneyLesson[0], createLessonLoadDiagnostics());
    expect(question).toBeDefined();

    const runtime = createQuestionRuntime(question!, {
      consequenceSelection: null,
      currentOrder: [],
      inputText: "",
      selectedIndex: null,
      selectedIndexes: [],
      selectedPairs: [],
      selectedResponse: 2,
      swipeDirection: null,
    });

    expect(question?.correct_index).toBeUndefined();
    expect(runtime.isSurveyMode).toBe(true);
    expect(runtime.isCorrect).toBe(true);
  });

  test("groups lessons by question id while retaining the real source", () => {
    const lesson = loadLessons("money").find((candidate) => candidate.level === 1);

    expect(lesson?.questions[0]?.id).toBe("money_l01_001");
    expect(lesson?.questions[0]?.source_id).toBe("doi_10_1080_01639625_2025_2608885");
    expect(lesson?.references?.[0]?.citation).toBe("doi_10_1080_01639625_2025_2608885");
  });
});
