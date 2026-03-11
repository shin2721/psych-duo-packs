jest.mock("react-native", () => ({
  Linking: {
    openURL: jest.fn(),
  },
}));

jest.mock("../../lib/analytics", () => ({
  Analytics: {
    track: jest.fn(),
  },
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("../../lib/plans", () => ({
  getSupabaseFunctionsUrl: jest.fn(),
  getPlanById: jest.fn(),
  isPlanPurchasable: jest.fn(() => true),
  resolvePlanPriceId: jest.fn(),
  supportsPlanBillingPeriod: jest.fn(() => true),
}));

const { Linking } = require("react-native");
const { Analytics } = require("../../lib/analytics");
const { supabase } = require("../../lib/supabase");
const { getSupabaseFunctionsUrl, getPlanById, resolvePlanPriceId, supportsPlanBillingPeriod } = require("../../lib/plans");
const { buyPlan, openBillingPortal, restorePurchases } = require("../../lib/billing");

describe("billing auth hardening", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    (Linking.openURL as jest.Mock).mockReset();
    (Analytics.track as jest.Mock).mockReset();
    (getSupabaseFunctionsUrl as jest.Mock).mockReset();
    (getPlanById as jest.Mock).mockReset();
    (resolvePlanPriceId as jest.Mock).mockReset();
    (supportsPlanBillingPeriod as jest.Mock).mockReset();
    (supabase.auth.getSession as jest.Mock).mockReset();
    (getPlanById as jest.Mock).mockReturnValue({ id: "pro" });
    (resolvePlanPriceId as jest.Mock).mockReturnValue("price_123");
    (supportsPlanBillingPeriod as jest.Mock).mockReturnValue(true);
  });

  test("openBillingPortal returns false and tracks missing_auth_token when session is absent", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const result = await openBillingPortal();

    expect(result).toEqual({ ok: false, reason: "missing_auth_token" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Analytics.track).toHaveBeenCalledWith("checkout_failed", {
      source: "billing_lib",
      reason: "missing_auth_token",
    });
  });

  test("openBillingPortal sends Authorization header and opens portal url", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://billing.stripe.com/session/test" }),
    });

    const result = await openBillingPortal();

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("https://example.functions.supabase.co/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-access-token",
      },
      body: "{}",
    });
    expect(Linking.openURL).toHaveBeenCalledWith("https://billing.stripe.com/session/test");
  });

  test("openBillingPortal returns portal_session_failed when response has no url", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "test-access-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await openBillingPortal();

    expect(result).toEqual({ ok: false, reason: "portal_session_failed" });
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  test("restorePurchases returns false and tracks missing_auth_token when session is absent", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const result = await restorePurchases();

    expect(result).toEqual({ status: "error", reason: "missing_auth_token" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Analytics.track).toHaveBeenCalledWith("checkout_failed", {
      source: "billing_lib",
      reason: "missing_auth_token",
    });
  });

  test("restorePurchases sends Authorization header and returns restored payload", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "restore-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        restored: true,
        planId: "pro",
        activeUntil: "2026-12-31T00:00:00.000Z",
      }),
    });

    const result = await restorePurchases();

    expect(fetchMock).toHaveBeenCalledWith("https://example.functions.supabase.co/restore-purchases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer restore-token",
      },
      body: "{}",
    });
    expect(result).toEqual({
      status: "restored",
      planId: "pro",
      activeUntil: "2026-12-31T00:00:00.000Z",
    });
  });

  test("restorePurchases returns not_found when nothing is restorable", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "restore-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        restored: false,
      }),
    });

    const result = await restorePurchases();

    expect(result).toEqual({ status: "not_found" });
  });

  test("restorePurchases returns error when request fails", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "restore-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "nope" }),
    });

    const result = await restorePurchases();

    expect(result).toEqual({ status: "error", reason: "restore_failed" });
  });

  test("buyPlan returns billing_period_unsupported without fetching", async () => {
    (supportsPlanBillingPeriod as jest.Mock).mockReturnValue(false);

    const result = await buyPlan("pro", "user_1", "user@example.com", {
      billingPeriod: "yearly",
    });

    expect(result).toEqual({ ok: false, reason: "billing_period_unsupported" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("buyPlan returns checkout_session_failed when checkout request errors", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: "checkout-token" } },
    });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await buyPlan("pro", "user_1", "user@example.com");

    expect(result).toEqual({ ok: false, reason: "checkout_session_failed" });
  });
});
