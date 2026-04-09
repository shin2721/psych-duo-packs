import type { IoniconName } from "../ioniconName";

export type SettingsDebugRoute = {
  icon: IoniconName;
  label: string;
  route: string;
  accessibilityLabel: string;
  testID: string;
};

export const SETTINGS_DEBUG_ROUTES: SettingsDebugRoute[] = [
  {
    icon: "analytics",
    label: "Analytics Debug",
    route: "/debug/analytics",
    accessibilityLabel: "Analytics Debug",
    testID: "open-analytics-debug",
  },
  {
    icon: "git-compare",
    label: "Course Preview Debug",
    route: "/debug/course-concept-final",
    accessibilityLabel: "Course Preview Debug",
    testID: "open-course-concept-final",
  },
  {
    icon: "planet",
    label: "Course World Hero (Experimental)",
    route: "/debug/course-world-hero",
    accessibilityLabel: "Course World Hero (Experimental)",
    testID: "open-course-world-hero",
  },
  {
    icon: "logo-electron",
    label: "Course Preview Claude",
    route: "/debug/course-concept-claude",
    accessibilityLabel: "Course Preview Claude",
    testID: "open-course-concept-claude",
  },
];
