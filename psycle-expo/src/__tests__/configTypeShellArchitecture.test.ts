import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("config and analytics type shell architecture", () => {
  test("gamificationConfig delegates defaults and normalizers", () => {
    const source = read("lib/gamificationConfig.ts");

    expect(source).toContain('from "./gamificationConfig.types"');
    expect(source).toContain('from "./gamificationConfig.defaults"');
    expect(source).toContain('from "./gamificationConfig.normalizers"');
  });

  test("analytics.types delegates tracked event definitions", () => {
    const source = read("lib/analytics.types.ts");
    const events = read("lib/analytics.events.ts");

    expect(source).toContain('export type {');
    expect(source).toContain('from "./analytics.events"');
    expect(events).toContain("export type TrackedEvent =");
  });
});
