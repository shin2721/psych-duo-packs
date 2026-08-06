import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`${__dirname}/../../${path}`, "utf8");
}

describe("useLessonRuntime architecture", () => {
  test("delegates to useLessonFlow and exposes screen-friendly state", () => {
    const source = read("lib/lesson/useLessonRuntime.ts");

    expect(source).toContain("export function useLessonRuntime");
    expect(source).toContain("const lessonFlow = useLessonFlow(params);");
    expect(source).toContain("resetSessionTracking()");
    expect(source).toContain("resolveLessonRuntimeAvailability");
    expect(source).toContain("...availability");
    expect(source).not.toContain("!lessonFlow.currentQuestion && !lessonFlow.isComplete");
  });
});
