import {
  parseCheckoutContextSnapshot,
  getCheckoutContextKey,
  type CheckoutContextSnapshot,
} from "../../lib/planChangeTracking";

describe("planChangeTracking: parseCheckoutContextSnapshot", () => {
  test("returns null for null input", () => {
    expect(parseCheckoutContextSnapshot(null)).toBeNull();
  });

  test("returns null for malformed JSON", () => {
    expect(parseCheckoutContextSnapshot("{not-json")).toBeNull();
  });

  test("returns null when planId is free or invalid", () => {
    expect(
      parseCheckoutContextSnapshot(
        JSON.stringify({
          planId: "free",
          billingPeriod: "monthly",
          trialDays: 0,
          priceVersion: "control",
          priceCohort: "default",
          startedAt: "2026-03-01T00:00:00.000Z",
        })
      )
    ).toBeNull();

    expect(
      parseCheckoutContextSnapshot(
        JSON.stringify({
          planId: "enterprise",
          billingPeriod: "monthly",
          trialDays: 0,
          priceVersion: "control",
          priceCohort: "default",
          startedAt: "2026-03-01T00:00:00.000Z",
        })
      )
    ).toBeNull();
  });

  test("parses valid pro variant payload", () => {
    const raw = JSON.stringify({
      planId: "pro",
      billingPeriod: "monthly",
      trialDays: 7,
      priceVersion: "variant_a",
      priceCohort: "jp_new_14d_free",
      startedAt: "2026-03-01T00:00:00.000Z",
    });

    expect(parseCheckoutContextSnapshot(raw)).toEqual<CheckoutContextSnapshot>({
      planId: "pro",
      billingPeriod: "monthly",
      trialDays: 7,
      priceVersion: "variant_a",
      priceCohort: "jp_new_14d_free",
      startedAt: "2026-03-01T00:00:00.000Z",
    });
  });

  test("falls back billingPeriod to monthly for invalid value", () => {
    const parsed = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "max",
        billingPeriod: "weekly",
        trialDays: 0,
        priceVersion: "control",
        priceCohort: "default",
        startedAt: "2026-03-01T00:00:00.000Z",
      })
    );

    expect(parsed?.billingPeriod).toBe("monthly");
  });

  test("normalizes trialDays with floor and lower bound", () => {
    const parsedWithFloat = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "pro",
        billingPeriod: "monthly",
        trialDays: 7.9,
        priceVersion: "control",
        priceCohort: "default",
        startedAt: "2026-03-01T00:00:00.000Z",
      })
    );

    const parsedWithNegative = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "pro",
        billingPeriod: "monthly",
        trialDays: -10,
        priceVersion: "control",
        priceCohort: "default",
        startedAt: "2026-03-01T00:00:00.000Z",
      })
    );

    const parsedWithNonFinite = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "pro",
        billingPeriod: "monthly",
        trialDays: "abc",
        priceVersion: "control",
        priceCohort: "default",
        startedAt: "2026-03-01T00:00:00.000Z",
      })
    );

    expect(parsedWithFloat?.trialDays).toBe(7);
    expect(parsedWithNegative?.trialDays).toBe(0);
    expect(parsedWithNonFinite?.trialDays).toBe(0);
  });

  test("falls back priceVersion to control for invalid value", () => {
    const parsed = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "max",
        billingPeriod: "monthly",
        trialDays: 0,
        priceVersion: "exp_b",
        priceCohort: "default",
        startedAt: "2026-03-01T00:00:00.000Z",
      })
    );

    expect(parsed?.priceVersion).toBe("control");
  });

  test("fills missing priceCohort and startedAt with defaults", () => {
    const parsed = parseCheckoutContextSnapshot(
      JSON.stringify({
        planId: "pro",
        billingPeriod: "yearly",
        trialDays: 0,
        priceVersion: "control",
      })
    );

    expect(parsed?.priceCohort).toBe("default");
    expect(parsed?.startedAt).toBe(new Date(0).toISOString());
  });
});

describe("planChangeTracking: getCheckoutContextKey", () => {
  test("builds checkout context key with prefix", () => {
    expect(getCheckoutContextKey("user-123")).toBe("checkout_context_user-123");
  });
});
