import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("useLessonLoader architecture", () => {
  test("wraps energy blocked and load failed behaviors", () => {
    const source = read("lib/lesson/useLessonLoader.ts");

    expect(source).toContain("export function useLessonLoader");
    expect(source).toContain("const handleEnergyBlocked = useCallback");
    expect(source).toContain("const handleLoadFailed = useCallback");
    expect(source).toContain('Analytics.track("energy_blocked"');
    expect(source).toContain('router.replace("/(tabs)/shop")');
    expect(source).toContain('router.back()');
  });
});
