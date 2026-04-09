import fs from "node:fs";

import { SETTINGS_DEBUG_ROUTES } from "../../lib/settings/settingsDebugRoutes";

const ROOT = "/Users/mashitashinji/dev/psych-duo-packs/psycle-expo";

function exists(path: string): boolean {
  return fs.existsSync(`${ROOT}/${path}`);
}

describe("debug shelf architecture", () => {
  test("settings retains only the approved debug routes", () => {
    expect(SETTINGS_DEBUG_ROUTES.map((route) => route.route)).toEqual([
      "/debug/analytics",
      "/debug/course-concept-final",
      "/debug/course-world-hero",
      "/debug/course-concept-claude",
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

  test("retained provisional comparison target stays wired", () => {
    expect(exists("components/provisional/CourseHeroFinal.tsx")).toBe(true);
    expect(exists("app/debug/course-concept-final.tsx")).toBe(true);
    expect(exists("app/debug/course-world-hero.tsx")).toBe(true);
    expect(exists("app/debug/course-concept-claude.tsx")).toBe(true);
  });
});
