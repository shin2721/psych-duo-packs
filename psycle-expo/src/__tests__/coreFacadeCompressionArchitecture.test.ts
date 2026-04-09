import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("core facade compression architecture", () => {
  test("useLessonFlow delegates helper and completion orchestration", () => {
    const source = read("lib/lesson/useLessonFlow.ts");
    const helpers = read("lib/lesson/lessonFlowHelpers.ts");
    const completion = read("lib/lesson/lessonFlowCompletion.ts");

    expect(source).toContain('from "./lessonFlowHelpers"');
    expect(source).toContain('from "./lessonFlowCompletion"');
    expect(source).not.toContain("export interface LessonAnswerTransition");
    expect(source).not.toContain("export function getLessonReminderSyncPayload");
    expect(source).not.toContain("export function resolveLessonAnswerTransition");
    expect(helpers).toContain("export interface LessonAnswerTransition");
    expect(helpers).toContain("export function getLessonReminderSyncPayload");
    expect(helpers).toContain("export function resolveLessonAnswerTransition");
    expect(completion).toContain("export async function completeLessonSession");
  });
});
