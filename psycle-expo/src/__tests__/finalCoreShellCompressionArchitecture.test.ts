import fs from "node:fs";

function read(path: string): string {
  return fs.readFileSync(`/Users/mashitashinji/dev/psych-duo-packs/psycle-expo/${path}`, "utf8");
}

describe("final core shell compression architecture", () => {
  test("analytics-debug delegates to analyticsDebugCore", () => {
    const source = read("lib/analytics-debug.ts");
    const core = read("lib/analyticsDebugCore.ts");

    expect(source).toContain('from "./analyticsDebugCore"');
    expect(source).not.toContain("let ringBuffer");
    expect(core).toContain("let ringBuffer");
    expect(core).toContain("export function getDebugReport()");
  });

  test("GlobalHeader delegates menu and genre helpers", () => {
    const source = read("components/GlobalHeader.tsx");
    const menu = read("components/GlobalHeaderMenu.tsx");
    const helpers = read("components/globalHeaderHelpers.tsx");

    expect(source).toContain('from "./GlobalHeaderMenu"');
    expect(source).toContain('from "./globalHeaderHelpers"');
    expect(source).not.toContain("const getGenreIcon");
    expect(menu).toContain("export function GlobalHeaderMenu");
    expect(helpers).toContain("export const getGenreIcon");
  });

  test("PlanSelector delegates plan data and plan card rendering", () => {
    const source = read("components/PlanSelector.tsx");
    const card = read("components/PlanSelectorCard.tsx");
    const data = read("components/planSelectorData.ts");

    expect(source).toContain('from "./PlanSelectorCard"');
    expect(source).toContain('from "./planSelectorData"');
    expect(source).not.toContain("const plans = [");
    expect(card).toContain("export function PlanSelectorCard");
    expect(data).toContain("export function buildPlanSelectorPlans");
  });
});
