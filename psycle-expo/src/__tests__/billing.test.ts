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
const { getSupabaseFunctionsUrl } = require("../../lib/plans");
const { openBillingPortal, restorePurchases } = require("../../lib/billing");

describe("billing auth hardening", () => {
  const fetchMock = jest.fn();
  const alertMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    alertMock.mockReset();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    (global as unknown as { alert: (message: string) => void }).alert = alertMock;
    (Linking.openURL as jest.Mock).mockReset();
    (Analytics.track as jest.Mock).mockReset();
    (getSupabaseFunctionsUrl as jest.Mock).mockReset();
    (supabase.auth.getSession as jest.Mock).mockReset();
  });

  test("openBillingPortal returns false and tracks missing_auth_token when session is absent", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const result = await openBillingPortal();

    expect(result).toBe(false);
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

    expect(result).toBe(true);
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

  test("restorePurchases returns false and tracks missing_auth_token when session is absent", async () => {
    (getSupabaseFunctionsUrl as jest.Mock).mockReturnValue("https://example.functions.supabase.co");
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const result = await restorePurchases();

    expect(result).toBe(false);
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
      restored: true,
      planId: "pro",
      activeUntil: "2026-12-31T00:00:00.000Z",
    });
    expect(alertMock).toHaveBeenCalledWith("購入を復元しました！プラン: PRO");
  });
});
