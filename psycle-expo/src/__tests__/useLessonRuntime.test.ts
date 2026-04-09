import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("useLessonRuntime architecture", () => {
  test("delegates to useLessonFlow and exposes screen-friendly state", () => {
    const source = read("lib/lesson/useLessonRuntime.ts");

    expect(source).toContain("export function useLessonRuntime");
    expect(source).toContain("const lessonFlow = useLessonFlow(params);");
    expect(source).toContain("resetSessionTracking()");
    expect(source).toContain("canStart: !lessonFlow.loading && Boolean(lessonFlow.currentQuestion)");
    expect(source).toContain("loadError: !lessonFlow.loading && !lessonFlow.currentQuestion && !lessonFlow.isComplete");
  });
});
