import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearBillingSnapshots,
  loadBillingSnapshotContext,
  persistCheckoutContextSnapshot,
  persistPlanChangeSnapshot,
} from "../../lib/app-state/billingStorage";
import {
  getCheckoutContextKey,
  getPlanChangeSnapshotKey,
} from "../../lib/planChangeTracking";

describe("billingStorage helpers", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("loadBillingSnapshotContext parses both snapshots and drops malformed JSON", async () => {
    await AsyncStorage.setItem(
      getPlanChangeSnapshotKey("user-1"),
      JSON.stringify({ planId: "pro", activeUntil: "2099-01-01T00:00:00.000Z" })
    );
    await AsyncStorage.setItem(getCheckoutContextKey("user-1"), "{bad-json");

    await expect(loadBillingSnapshotContext("user-1")).resolves.toEqual({
      planChangeSnapshot: {
        planId: "pro",
        activeUntil: "2099-01-01T00:00:00.000Z",
      },
      checkoutContextSnapshot: null,
    });
  });

  test("persist helpers preserve set and remove semantics", async () => {
    await persistPlanChangeSnapshot("user-1", {
      planId: "max",
      activeUntil: null,
    });
    await persistCheckoutContextSnapshot("user-1", {
      planId: "pro",
      billingPeriod: "monthly",
      trialDays: 7,
      priceVersion: "variant_a",
      priceCohort: "jp_new_14d_free",
      startedAt: "2026-04-06T00:00:00.000Z",
    });

    expect(await AsyncStorage.getItem(getPlanChangeSnapshotKey("user-1"))).toBe(
      JSON.stringify({ planId: "max", activeUntil: null })
    );
    expect(await AsyncStorage.getItem(getCheckoutContextKey("user-1"))).toBe(
      JSON.stringify({
        planId: "pro",
        billingPeriod: "monthly",
        trialDays: 7,
        priceVersion: "variant_a",
        priceCohort: "jp_new_14d_free",
        startedAt: "2026-04-06T00:00:00.000Z",
      })
    );

    await persistPlanChangeSnapshot("user-1", null);
    await persistCheckoutContextSnapshot("user-1", null);

    expect(await AsyncStorage.getItem(getPlanChangeSnapshotKey("user-1"))).toBeNull();
    expect(await AsyncStorage.getItem(getCheckoutContextKey("user-1"))).toBeNull();
  });

  test("clearBillingSnapshots removes both billing snapshot keys", async () => {
    await AsyncStorage.setItem(getPlanChangeSnapshotKey("user-1"), "x");
    await AsyncStorage.setItem(getCheckoutContextKey("user-1"), "y");

    await clearBillingSnapshots("user-1");

    expect(await AsyncStorage.getItem(getPlanChangeSnapshotKey("user-1"))).toBeNull();
    expect(await AsyncStorage.getItem(getCheckoutContextKey("user-1"))).toBeNull();
  });
});
