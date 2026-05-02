import {
  applyDifficultyPacing,
  resolveDifficultyPacing,
  type DifficultyPacingDecision,
} from "../../lib/lesson/difficultyPacing";
import type { Question } from "../../types/question";

const questions: Question[] = [
  { id: "easy_1", type: "multiple_choice", question: "e1", choices: ["a"], correct_index: 0, difficulty: "easy", xp: 1 },
  { id: "medium_1", type: "multiple_choice", question: "m1", choices: ["a"], correct_index: 0, difficulty: "medium", xp: 1 },
  { id: "hard_1", type: "multiple_choice", question: "h1", choices: ["a"], correct_index: 0, difficulty: "hard", xp: 1 },
  { id: "easy_2", type: "multiple_choice", question: "e2", choices: ["a"], correct_index: 0, difficulty: "easy", xp: 1 },
  { id: "medium_2", type: "multiple_choice", question: "m2", choices: ["a"], correct_index: 0, difficulty: "medium", xp: 1 },
  { id: "hard_2", type: "multiple_choice", question: "h2", choices: ["a"], correct_index: 0, difficulty: "hard", xp: 1 },
];

function baseDecision(overrides: Partial<Parameters<typeof resolveDifficultyPacing>[0]> = {}) {
  return resolveDifficultyPacing({
    baseLessonSize: 4,
    firstLessonCompleted: true,
    firstSessionLessonSize: 3,
    isIntroLesson: false,
    maxQuestionCount: questions.length,
    optimalPMax: 0.7,
    optimalPMin: 0.55,
    questionsAnswered: 10,
    recentAccuracy: 0.65,
    skillConfidence: 0.5,
    ...overrides,
  });
}

describe("difficulty pacing", () => {
  test("keeps intro lessons short before first completion", () => {
    expect(
      baseDecision({
        firstLessonCompleted: false,
        isIntroLesson: true,
      })
    ).toEqual({
      mode: "first_session",
      questionCount: 3,
      targetDifficulty: "easy",
    });
  });

  test("backs off when recent accuracy is below the optimal window", () => {
    expect(baseDecision({ recentAccuracy: 0.4 })).toEqual({
      mode: "support",
      questionCount: 2,
      targetDifficulty: "easy",
    });
  });

  test("stretches strong users only after enough confidence", () => {
    expect(baseDecision({ recentAccuracy: 0.9, skillConfidence: 0.5 })).toEqual({
      mode: "stretch",
      questionCount: 6,
      targetDifficulty: "hard",
    });
    expect(baseDecision({ recentAccuracy: 0.9, skillConfidence: 0.1 }).mode).toBe("steady");
  });

  test("prioritizes questions closest to the target difficulty", () => {
    const decision: DifficultyPacingDecision = {
      mode: "support",
      questionCount: 2,
      targetDifficulty: "easy",
    };

    expect(applyDifficultyPacing(questions, decision).map((question) => question.id)).toEqual([
      "easy_1",
      "easy_2",
    ]);
  });
});
