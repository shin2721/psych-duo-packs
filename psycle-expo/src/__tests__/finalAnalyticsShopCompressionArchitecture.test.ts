import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final analytics and shop compression architecture", () => {
  test("AnalyticsDebug delegates sections and actions", () => {
    const source = read("components/AnalyticsDebug.tsx");
    const sections = read("components/analyticsDebugSections.tsx");

    expect(source).toContain("AnalyticsDebugHeader");
    expect(source).toContain("AnalyticsStatusSection");
    expect(source).toContain("AnalyticsCountersSection");
    expect(source).toContain("AnalyticsRecentEventsSection");
    expect(source).toContain("AnalyticsDebugActions");
    expect(source).not.toContain("const countersGrid");
    expect(sections).toContain("export function AnalyticsDebugHeader");
    expect(sections).toContain("export function AnalyticsDebugActions");
  });

  test("ShopSubscriptionsSection delegates subscription cards", () => {
    const source = read("components/shop/ShopSubscriptionsSection.tsx");
    const cards = read("components/shop/ShopSubscriptionCards.tsx");

    expect(source).toContain('from "./ShopSubscriptionCards"');
    expect(source).toContain("ActiveSubscriptionCard");
    expect(source).toContain("BillingPeriodToggle");
    expect(source).toContain("SubscriptionPlansGrid");
    expect(cards).toContain("export function ActiveSubscriptionCard");
    expect(cards).toContain("export function SubscriptionPlansGrid");
  });
});
