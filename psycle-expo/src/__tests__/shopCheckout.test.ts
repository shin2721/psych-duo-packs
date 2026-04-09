jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/billing", () => ({
  buyPlan: jest.fn(),
}));

jest.mock("../../lib/app-state/billingStorage", () => ({
  persistCheckoutContextSnapshot: jest.fn(),
}));

jest.mock("../../lib/experimentEngine", () => ({
  assignExperiment: jest.fn(),
}));

jest.mock("../../lib/plans", () => ({
  getSupabaseFunctionsUrl: jest.fn(),
  resolvePlanPriceId: jest.fn(),
  supportsPlanBillingPeriod: jest.fn(),
}));

jest.mock("../../lib/pricing", () => ({
  detectUserRegion: jest.fn(),
}));

const { Analytics } = require("../../lib/analytics");
const { buyPlan } = require("../../lib/billing");
const { persistCheckoutContextSnapshot } = require("../../lib/app-state/billingStorage");
const { assignExperiment } = require("../../lib/experimentEngine");
const { getSupabaseFunctionsUrl, resolvePlanPriceId, supportsPlanBillingPeriod } = require("../../lib/plans");
const { detectUserRegion } = require("../../lib/pricing");
const {
  resolveCheckoutTrialDays,
  resolveCheckoutPriceContext,
  startShopCheckout,
} = require("../../lib/shop/shopCheckout");

describe("shopCheckout", () => {
  const plan = { id: "pro", priceMonthly: 980 };

  beforeEach(() => {
    jest.clearAllMocks();
    (supportsPlanBillingPeriod as jest.Mock).mockReturnValue(true);
    (resolvePlanPriceId as jest.Mock).mockReturnValue("price_123");
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (detectUserRegion as jest.Mock).mockReturnValue("JP");
    (buyPlan as jest.Mock).mockResolvedValue({ ok: true });
    (persistCheckoutContextSnapshot as jest.Mock).mockResolvedValue(undefined);
    (assignExperiment as jest.Mock).mockReturnValue(null);
  });

  test("resolveCheckoutTrialDays clamps experiment payload", () => {
    (assignExperiment as jest.Mock).mockReturnValue({ payload: { trialDays: 45 } });
    expect(resolveCheckoutTrialDays("user_1")).toBe(30);
  });

  test("resolveCheckoutPriceContext returns jp variant for new free user", () => {
    (assignExperiment as jest.Mock).mockReturnValue({ variantId: "variant_a" });
    expect(
      resolveCheckoutPriceContext({
        plan,
        billingPeriod: "monthly",
        userRegion: "JP",
        planId: "free",
        userId: "user_1",
        accountAgeDays: 7,
      })
    ).toEqual({
      priceVersion: "variant_a",
      priceCohort: "jp_new_14d_free",
    });
  });

  test("returns billingPeriodUnavailable when period is unsupported", async () => {
    (supportsPlanBillingPeriod as jest.Mock).mockReturnValue(false);

    const result = await startShopCheckout({
      plan,
      billingPeriod: "yearly",
      user: { id: "user_1", email: "user@example.com" },
      currentPlanId: "free",
      accountAgeDays: 1,
      sessionAccessToken: "token",
    });

    expect(result).toEqual({
      ok: false,
      reason: "billing_period_unavailable",
      messageKey: "shop.errors.billingPeriodUnavailable",
    });
    expect(buyPlan).not.toHaveBeenCalled();
  });

  test("returns checkoutProcessFailed when auth token is missing", async () => {
    const result = await startShopCheckout({
      plan,
      billingPeriod: "monthly",
      user: { id: "user_1", email: "user@example.com" },
      currentPlanId: "free",
      accountAgeDays: 1,
    });

    expect(result).toEqual({
      ok: false,
      reason: "missing_auth_token",
      messageKey: "shop.errors.checkoutProcessFailed",
    });
    expect(Analytics.track).toHaveBeenCalledWith("checkout_failed", {
      source: "shop_tab",
      planId: "pro",
      reason: "missing_auth_token",
    });
  });

  test("persists checkout context and forwards shop_tab source on success", async () => {
    await startShopCheckout({
      plan,
      billingPeriod: "monthly",
      user: { id: "user_1", email: "user@example.com" },
      currentPlanId: "free",
      accountAgeDays: 1,
      sessionAccessToken: "token",
    });

    expect(persistCheckoutContextSnapshot).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        planId: "pro",
        billingPeriod: "monthly",
        priceVersion: "control",
        priceCohort: "jp_new_14d_free",
      })
    );
    expect(buyPlan).toHaveBeenCalledWith(
      "pro",
      "user_1",
      "user@example.com",
      expect.objectContaining({
        source: "shop_tab",
        accessToken: "token",
      })
    );
    expect(Analytics.track).toHaveBeenCalledWith("checkout_start", {
      source: "shop_tab",
      planId: "pro",
      billingPeriod: "monthly",
      trialDays: 0,
      priceVersion: "control",
      priceCohort: "jp_new_14d_free",
    });
  });

  test("maps missing checkout url to checkoutSessionFailed", async () => {
    (buyPlan as jest.Mock).mockResolvedValue({ ok: false, reason: "missing_checkout_url" });

    const result = await startShopCheckout({
      plan,
      billingPeriod: "monthly",
      user: { id: "user_1", email: "user@example.com" },
      currentPlanId: "free",
      accountAgeDays: 1,
      sessionAccessToken: "token",
    });

    expect(result).toEqual({
      ok: false,
      reason: "missing_checkout_url",
      messageKey: "shop.errors.checkoutSessionFailed",
    });
  });
});
