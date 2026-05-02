import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("analytics debug architecture", () => {
  test("AnalyticsDebug delegates header, sections, and actions", () => {
    const source = read("components/AnalyticsDebug.tsx");
    const sections = read("components/analyticsDebugSections.tsx");

    expect(source).toContain("AnalyticsDebugHeader");
    expect(source).toContain("AnalyticsStatusSection");
    expect(source).toContain("AnalyticsCountersSection");
    expect(source).toContain("AnalyticsEngagementHealthSection");
    expect(source).toContain("AnalyticsEngagementAuditSection");
    expect(source).toContain("AnalyticsRecentEventsSection");
    expect(source).toContain("AnalyticsDebugActions");
    expect(source).not.toContain("state.events.slice(0, 10).map");

    expect(sections).toContain("export function AnalyticsDebugHeader");
    expect(sections).toContain("export function AnalyticsEngagementHealthSection");
    expect(sections).toContain("export function AnalyticsEngagementAuditSection");
    expect(sections).toContain("export function AnalyticsDebugActions");
  });
});
