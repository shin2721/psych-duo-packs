import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("question interaction architecture", () => {
  test("QuestionInteraction delegates prompt, choice, advanced, and footer rendering", () => {
    const source = read("components/question-runtime/QuestionInteraction.tsx");
    const prompt = read("components/question-runtime/QuestionPrompt.tsx");
    const choiceBlocks = read("components/question-runtime/QuestionChoiceBlocks.tsx");
    const advancedBlocks = read("components/question-runtime/QuestionAdvancedBlocks.tsx");
    const footer = read("components/question-runtime/QuestionSubmitFooter.tsx");

    expect(source).toContain("QuestionPrompt");
    expect(source).toContain("QuestionChoiceBlocks");
    expect(source).toContain("QuestionAdvancedBlocks");
    expect(source).toContain("QuestionSubmitFooter");
    expect(source).not.toContain("function MultipleChoice(");
    expect(source).not.toContain("function TrueFalse(");
    expect(source).not.toContain("function FillBlank(");

    expect(prompt).toContain("export function QuestionPrompt");
    expect(choiceBlocks).toContain("export function QuestionChoiceBlocks");
    expect(advancedBlocks).toContain("export function QuestionAdvancedBlocks");
    expect(footer).toContain("export function QuestionSubmitFooter");
  });
});
