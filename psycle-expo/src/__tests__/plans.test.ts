jest.mock("expo/virtual/env", () => ({ env: process.env }), { virtual: true });

jest.mock("../../lib/gamificationConfig", () => ({
  ...jest.requireActual("../../lib/gamificationConfig"),
  getCheckoutConfig: jest.fn(),
}));

const { getCheckoutConfig } = require("../../lib/gamificationConfig");
const {
  getPurchasablePlans,
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

  test("billing period support is plan-specific", () => {
    expect(supportsPlanBillingPeriod("pro", "monthly")).toBe(true);
    expect(supportsPlanBillingPeriod("pro", "yearly")).toBe(false);
    expect(supportsPlanBillingPeriod("max", "monthly")).toBe(true);
    expect(supportsPlanBillingPeriod("max", "yearly")).toBe(false);
  });

  test("price id resolution is monthly-first and yearly-safe", () => {
    expect(resolvePlanPriceId("pro", "monthly")).toEqual(expect.any(String));
    expect(resolvePlanPriceId("pro", "yearly")).toBeNull();
    expect(resolvePlanPriceId("max", "monthly")).toEqual(expect.any(String));
    expect(resolvePlanPriceId("max", "yearly")).toBeNull();
  });
});
