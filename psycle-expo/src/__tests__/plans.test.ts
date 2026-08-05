jest.mock("expo/virtual/env", () => ({ env: process.env }), { virtual: true });

jest.mock("../../lib/gamificationConfig", () => ({
  ...jest.requireActual("../../lib/gamificationConfig"),
  getCheckoutConfig: jest.fn(),
}));

const { getCheckoutConfig } = require("../../lib/gamificationConfig");
const {
  getStorefrontPlans,
  getPurchasablePlans,
  getPlanById,
  isPlanPurchasable,
  resolvePlanPriceId,
  supportsPlanBillingPeriod,
} = require("../../lib/plans");

const mockedGetCheckoutConfig = getCheckoutConfig as jest.MockedFunction<typeof getCheckoutConfig>;

describe("plans", () => {
  afterEach(() => {
    mockedGetCheckoutConfig.mockReset();
  });

  test("Pro is always purchasable", () => {
    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: false });
    expect(isPlanPurchasable("pro")).toBe(true);

    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: true });
    expect(isPlanPurchasable("pro")).toBe(true);
  });

  test("Pro features describe the current energy behavior without stale catalog claims", () => {
    const features = getPlanById("pro")?.features ?? [];

    expect(features).toContain("レッスン中のエネルギー消費なし");
    expect(features).not.toContain("全300+レッスン無制限アクセス");
    expect(features).not.toContain("ライフ無制限");
  });

  test("Max follows checkout gate", () => {
    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: false });
    expect(isPlanPurchasable("max")).toBe(false);

    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: true });
    expect(isPlanPurchasable("max")).toBe(true);
  });

  test("getPurchasablePlans hides Max when gate is off", () => {
    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: false });
    expect(getPurchasablePlans().map((plan: { id: string }) => plan.id)).toEqual(["pro"]);
  });

  test("getPurchasablePlans includes Max when gate is on", () => {
    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: true });
    expect(getPurchasablePlans().map((plan: { id: string }) => plan.id)).toEqual(["pro", "max"]);
  });

  test("getStorefrontPlans hides Max while Max offer is frozen", () => {
    mockedGetCheckoutConfig.mockReturnValue({ max_plan_enabled: true });
    expect(getStorefrontPlans().map((plan: { id: string }) => plan.id)).toEqual(["pro"]);
  });

  test("billing period support is plan-specific", () => {
    expect(supportsPlanBillingPeriod("pro", "monthly")).toBe(true);
    expect(supportsPlanBillingPeriod("pro", "yearly")).toBe(false);
    expect(supportsPlanBillingPeriod("max", "monthly")).toBe(true);
    expect(supportsPlanBillingPeriod("max", "yearly")).toBe(false);
  });

  test("price id resolution is monthly-first and yearly-safe", () => {
    expect(resolvePlanPriceId("pro", "monthly")).toEqual(expect.any(String));
    expect(resolvePlanPriceId("pro", "monthly", "variant_a")).toEqual(expect.any(String));
    expect(resolvePlanPriceId("pro", "yearly")).toBeNull();
    expect(resolvePlanPriceId("max", "monthly")).toEqual(expect.any(String));
    expect(resolvePlanPriceId("max", "yearly")).toBeNull();
  });
});
