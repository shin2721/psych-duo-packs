import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final cleanup bundle architecture", () => {
  test("question and lesson data typing no longer use cleanup-target any types", () => {
    const questionTypes = read("types/question.ts");
    const lessonDataType = read("types/lessonData.ts");
    const generator = read("scripts/gen-lesson-locale-index.js");
    const mentalIndex = read("data/lessons/mental_units/index.ts");
    const workIndex = read("data/lessons/work_units/index.ts");

    expect(questionTypes).toContain("practice_config?: Record<string, unknown>;");
    expect(questionTypes).toContain("source?: unknown;");
    expect(questionTypes).not.toContain("practice_config?: any;");
    expect(questionTypes).not.toContain("source?: any;");

    expect(lessonDataType).toContain("export type RawLessonJsonEntry = Record<string, unknown>;");
    expect(generator).toContain('import type { RawLessonJsonEntry } from "../../../types/lessonData";');
    expect(generator).toContain("): RawLessonJsonEntry[] {");
    expect(generator).not.toContain("): any[] {");

    expect(mentalIndex).toContain('import type { RawLessonJsonEntry } from "../../../types/lessonData";');
    expect(mentalIndex).toContain("): RawLessonJsonEntry[] {");
    expect(workIndex).toContain('import type { RawLessonJsonEntry } from "../../../types/lessonData";');
    expect(workIndex).toContain("): RawLessonJsonEntry[] {");
  });
});
