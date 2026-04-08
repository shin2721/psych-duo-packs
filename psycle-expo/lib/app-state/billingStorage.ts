import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCheckoutContextKey,
  getPlanChangeSnapshotKey,
  parseCheckoutContextSnapshot,
  parsePlanChangeSnapshot,
  type CheckoutContextSnapshot,
  type PlanChangeSnapshot,
} from "../planChangeTracking";

export interface BillingSnapshotContext {
  checkoutContextSnapshot: CheckoutContextSnapshot | null;
  planChangeSnapshot: PlanChangeSnapshot | null;
}

export async function loadBillingSnapshotContext(userId: string): Promise<BillingSnapshotContext> {
  const [rawPlanChangeSnapshot, rawCheckoutContextSnapshot] = await Promise.all([
    AsyncStorage.getItem(getPlanChangeSnapshotKey(userId)),
    AsyncStorage.getItem(getCheckoutContextKey(userId)),
  ]);

  return {
    planChangeSnapshot: parsePlanChangeSnapshot(rawPlanChangeSnapshot),
    checkoutContextSnapshot: parseCheckoutContextSnapshot(rawCheckoutContextSnapshot),
  };
}

export async function persistPlanChangeSnapshot(
  userId: string,
  snapshot: PlanChangeSnapshot | null
): Promise<void> {
  const key = getPlanChangeSnapshotKey(userId);
  if (snapshot === null) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, JSON.stringify(snapshot));
}

export async function persistCheckoutContextSnapshot(
  userId: string,
  snapshot: CheckoutContextSnapshot | null
): Promise<void> {
  const key = getCheckoutContextKey(userId);
  if (snapshot === null) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, JSON.stringify(snapshot));
}

export async function clearBillingSnapshots(userId: string): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(getPlanChangeSnapshotKey(userId)),
    AsyncStorage.removeItem(getCheckoutContextKey(userId)),
  ]);
}
