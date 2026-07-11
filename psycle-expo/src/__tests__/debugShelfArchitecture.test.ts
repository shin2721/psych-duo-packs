import fs from "node:fs";

import { SETTINGS_DEBUG_ROUTES } from "../../lib/settings/settingsDebugRoutes";

function exists(path: string): boolean {
  return fs.existsSync(`${process.cwd()}/${path}`);
}

describe("debug shelf architecture", () => {
  test("settings retains only the approved debug routes", () => {
    expect(SETTINGS_DEBUG_ROUTES.map((route) => route.route)).toEqual([
      "/debug/analytics",
      "/debug/course-world-hero",
    ]);
  });

  test("orphaned debug screens and provisional variants are removed", () => {
    expect(exists("app/debug/course-path-concept.tsx")).toBe(false);
    expect(exists("app/debug/course-focus-concept.tsx")).toBe(false);
    expect(exists("components/provisional/CourseHeroNebula.tsx")).toBe(false);
    expect(exists("components/provisional/CourseHeroBeacon.tsx")).toBe(false);
    expect(exists("components/provisional/CourseHeroCircuit.tsx")).toBe(false);
    expect(exists("components/provisional/CourseHeroSummit.tsx")).toBe(false);
  });

  test("only the active course-world debug target stays wired", () => {
    expect(exists("components/provisional/CourseHeroFinal.tsx")).toBe(false);
    expect(exists("app/debug/course-concept-final.tsx")).toBe(false);
    expect(exists("app/debug/course-world-hero.tsx")).toBe(true);
  });
});
