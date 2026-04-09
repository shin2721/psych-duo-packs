import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("module compression architecture", () => {
  test("analytics delegates core implementation to a thin shell", () => {
    const source = read("lib/analytics.ts");
    const core = read("lib/analyticsCore.ts");

    expect(source).toContain('from "./analyticsCore"');
    expect(source).not.toContain("class AnalyticsCore");
    expect(core).toContain('from "./analytics-runtime/analyticsTransport"');
    expect(core).toContain('from "./analytics-runtime/analyticsDebugRuntime"');
  });

  test("lessons delegates question adaptation and lesson title lookup", () => {
    const source = read("lib/lessons.ts");

    expect(source).toContain('from "./lesson-data/lessonQuestionAdapter"');
    expect(source).toContain('from "./lesson-data/lessonTitles"');
    expect(source).not.toContain("function adaptQuestion(");
    expect(source).not.toContain("function getLessonTitle(");
  });

  test("CourseHeroFinal uses extracted scene component", () => {
    const source = read("components/provisional/CourseHeroFinal.tsx");
    const scene = read("components/provisional/courseHeroFinal/CourseHeroFinalScene.tsx");

    expect(source).toContain("CourseHeroFinalScene");
    expect(source).not.toContain("const CANOPY_ORBS");
    expect(scene).toContain("CANOPY_ORBS");
    expect(scene).toContain("export function CourseHeroFinalScene");
  });

  test("claudePreview delegates large HTML payload to companion module", () => {
    const source = read("lib/debug/claudePreview.ts");
    const htmlSource = read("lib/debug/claudePreviewHtml.ts");

    expect(source).toContain('from "./claudePreviewHtml"');
    expect(source).not.toContain("<!DOCTYPE html>");
    expect(htmlSource).toContain("<!DOCTYPE html>");
    expect(htmlSource).toContain("export const claudePreviewHtml");
  });

  test("courseWorld delegates view-model building to a companion module", () => {
    const source = read("lib/courseWorld.ts");
    const model = read("lib/courseWorldModel.ts");

    expect(source).toContain('from "./courseWorldModel"');
    expect(source).not.toContain("function buildSequence(");
    expect(model).toContain("function buildSequence(");
    expect(model).toContain("export function buildCourseWorldViewModel(");
  });
});
