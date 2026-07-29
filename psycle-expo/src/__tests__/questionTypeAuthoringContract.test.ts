import fs from "node:fs";
import path from "node:path";
import { validateAuthoredQuestionPayload } from "../../scripts/validate-lessons";
import { RUNTIME_REACHABLE_QUESTION_TYPES } from "../../types/question";

const appRoot = path.resolve(__dirname, "../..");

function base(type: string) {
  return {
    id: `mental_l01_${type}`,
    type,
    question: "質問",
    explanation: "解説",
    difficulty: "easy",
    xp: 5,
    evidence_grade: "silver",
  };
}

const validQuestions: Record<string, Record<string, unknown>> = {
  true_false: {
    ...base("true_false"),
    choices: ["正しい", "違う"],
    correct_index: 0,
  },
  multiple_choice: {
    ...base("multiple_choice"),
    choices: ["A", "B", "C"],
    correct_index: 1,
  },
  fill_blank: {
    ...base("fill_blank"),
    choices: ["A", "B"],
    correct_index: 0,
  },
  sort_order: {
    ...base("sort_order"),
    items: ["A", "B", "C"],
    correct_order: ["A", "B", "C"],
  },
  select_all: {
    ...base("select_all"),
    choices: ["A", "B", "C"],
    correct_answers: [0, 2],
  },
  fill_blank_tap: {
    ...base("fill_blank_tap"),
    statement: "A［　］C",
    choices: ["B", "D"],
    correct_index: 0,
  },
  swipe_judgment: {
    ...base("swipe_judgment"),
    is_true: true,
    swipe_labels: { left: "違う", right: "合っている" },
  },
  conversation: {
    ...base("conversation"),
    choices: ["A", "B"],
    recommended_index: 1,
  },
  matching: {
    ...base("matching"),
    left_items: ["A", "B"],
    right_items: ["1", "2"],
    correct_pairs: [[0, 0], [1, 1]],
  },
  quick_reflex: {
    ...base("quick_reflex"),
    choices: ["A", "B"],
    correct_index: 0,
    time_limit: 2000,
  },
  micro_input: {
    ...base("micro_input"),
    input_answer: "A",
  },
  consequence_scenario: {
    ...base("consequence_scenario"),
    consequence_type: "positive",
  },
  term_card: {
    ...base("term_card"),
    term: "認知的評価",
    definition: "出来事をどう捉えたかという評価",
  },
  number_bet: {
    ...base("number_bet"),
    bet_min: 5,
    bet_max: 30,
    bet_start: 20,
    bet_answer: 10,
    bet_tolerance: 3,
    bet_unit: "人",
  },
};

describe("question type authoring contract", () => {
  test("allows exactly the formats that have an answer-to-continue runtime path", () => {
    expect(Object.keys(validQuestions)).toEqual([...RUNTIME_REACHABLE_QUESTION_TYPES]);

    for (const type of RUNTIME_REACHABLE_QUESTION_TYPES) {
      expect(validateAuthoredQuestionPayload(validQuestions[type] as never)).toEqual([]);
    }
  });

  test.each(["scenario", "animated_explanation", "interactive_practice"])(
    "rejects the declared but runtime-unconnected %s format",
    (type) => {
      expect(validateAuthoredQuestionPayload(base(type) as never)).toEqual([
        expect.stringContaining("runtime未接続"),
      ]);
    }
  );

  test("rejects a reachable type when its payload would leave the screen unusable", () => {
    expect(validateAuthoredQuestionPayload(base("quick_reflex") as never)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("choices"),
        expect.stringContaining("correct_index"),
      ])
    );
  });

  test("accepts adapter-supported survey and legacy swipe payloads still in production data", () => {
    expect(
      validateAuthoredQuestionPayload({
        ...base("conversation"),
        choices: ["A", "B"],
        recommended_index: null,
      } as never)
    ).toEqual([]);
    expect(
      validateAuthoredQuestionPayload({
        ...base("swipe_judgment"),
        correct_answer: "right",
        left_label: "違う",
        right_label: "合っている",
      } as never)
    ).toEqual([]);
  });

  test("keeps every authorable type connected to an active interaction block", () => {
    const rendererSource = [
      "components/question-runtime/QuestionChoiceBlocks.tsx",
      "components/question-runtime/QuestionAdvancedBlocks.tsx",
      "components/question-runtime/QuestionSubmitFooter.tsx",
    ]
      .map((relativePath) => fs.readFileSync(path.join(appRoot, relativePath), "utf8"))
      .join("\n");

    for (const type of RUNTIME_REACHABLE_QUESTION_TYPES) {
      expect(rendererSource).toContain(`question.type === "${type}"`);
    }
  });
});
