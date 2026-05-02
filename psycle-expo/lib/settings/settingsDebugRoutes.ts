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
    label: "GPT 試作UI",
    route: "/debug/course-concept-final",
    accessibilityLabel: "GPT 試作UI",
    testID: "open-course-concept-final",
  },
];
