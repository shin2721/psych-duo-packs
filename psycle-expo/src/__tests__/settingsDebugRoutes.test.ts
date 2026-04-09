import { SETTINGS_DEBUG_ROUTES } from "../../lib/settings/settingsDebugRoutes";

describe("settingsDebugRoutes", () => {
  test("keeps published settings debug entries and test ids aligned", () => {
    expect(SETTINGS_DEBUG_ROUTES).toEqual([
      expect.objectContaining({
        route: "/debug/analytics",
        testID: "open-analytics-debug",
      }),
      expect.objectContaining({
        route: "/debug/course-concept-final",
        testID: "open-course-concept-final",
      }),
      expect.objectContaining({
        route: "/debug/course-world-hero",
        testID: "open-course-world-hero",
      }),
      expect.objectContaining({
        route: "/debug/course-concept-claude",
        testID: "open-course-concept-claude",
      }),
    ]);
  });
});
