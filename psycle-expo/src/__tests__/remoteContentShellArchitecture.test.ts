import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("remote content shell architecture", () => {
  test("remoteContent delegates runtime helpers and shared types", () => {
    const source = read("lib/remoteContent.ts");

    expect(source).toContain('from "./remoteContentRuntime"');
    expect(source).toContain('from "./remoteContent.shared"');
    expect(source).toContain('from "./remoteContent.types"');
    expect(source).not.toContain("async function fetchWithRetry(");
    expect(source).not.toContain("async function downloadLessonsParallel(");
  });
});
