import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final ui polish compression architecture", () => {
  test("QuestionRenderer delegates helpers and view shell", () => {
    const source = read("components/QuestionRenderer.tsx");
    const view = read("components/QuestionRendererView.tsx");
    const helpers = read("components/question-runtime/questionRendererHelpers.ts");

    expect(source).toContain('from "./QuestionRendererView"');
    expect(source).toContain('from "./question-runtime/questionRendererHelpers"');
    expect(source).not.toContain("export const getQuestionText");
    expect(view).toContain("export function QuestionRendererView");
    expect(helpers).toContain("export const getQuestionText");
    expect(helpers).toContain("export const areSelectAllAnswersCorrect");
  });

  test("EvidenceBottomSheet delegates source lookup and detail rendering", () => {
    const source = read("components/EvidenceBottomSheet.tsx");
    const details = read("components/EvidenceBottomSheetDetails.tsx");
    const sources = read("components/evidenceBottomSheetSources.ts");

    expect(source).toContain('from \'./EvidenceBottomSheetDetails\'');
    expect(source).not.toContain("interface CuratedSourcesJson");
    expect(details).toContain("export function EvidenceBottomSheetDetails");
    expect(details).toContain('from "./evidenceBottomSheetSources"');
    expect(sources).toContain("export function getSourceInfo");
  });

  test("dogfood delegates helpers and export building", () => {
    const source = read("lib/dogfood.ts");
    const helpers = read("lib/dogfoodHelpers.ts");
    const exportSource = read("lib/dogfoodExport.ts");

    expect(source).toContain('from "./dogfoodHelpers"');
    expect(source).toContain('from "./dogfoodExport"');
    expect(helpers).toContain("export function getOrCreateDogfoodEntry");
    expect(exportSource).toContain("export function buildExportableDogfoodJson");
  });
});
