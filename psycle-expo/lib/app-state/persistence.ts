import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY_PREFIXES = {
  xp: "xp",
  gems: "gems",
  streak: "streak",
  quests: "quests",
  questCycleKeys: "quest_cycle_keys",
  questSchemaVersion: "quest_schema_version",
  questRotationPrev: "quest_rotation_prev",
  energy: "energy",
  energyUpdateTime: "energy_update_time",
  energyBonusDate: "energy_bonus_date",
  energyBonusCount: "energy_bonus_count",
  energyRefillDate: "energy_refill_date",
  energyRefillCount: "energy_refill_count",
  questRerollDate: "quest_reroll_date",
  questRerollCount: "quest_reroll_count",
  mistakes: "mistakes",
  reviewEvents: "review_events",
  firstLaunchAt: "first_launch_at",
  firstDayEnergyBonusTracked: "first_day_energy_bonus_tracked",
  streakRepairOffer: "streak_repair_offer",
  comebackRewardOffer: "comeback_reward_offer",
  streakMilestonesClaimed: "streak_milestones_claimed",
  eventCampaignState: "event_campaign_state",
  personalizationSegment: "personalization_segment",
  personalizationSegmentAssignedAt: "personalization_segment_assigned_at",
} as const;

type UserKeyName = keyof typeof USER_KEY_PREFIXES;

export function getUserStorageKey(name: UserKeyName, userId: string): string {
  return `${USER_KEY_PREFIXES[name]}_${userId}`;
}

export async function loadUserEntries(
  userId: string,
  names: readonly UserKeyName[]
): Promise<Record<UserKeyName, string | null>> {
  const keys = names.map((name) => getUserStorageKey(name, userId));
  const values = await Promise.all(keys.map((key) => AsyncStorage.getItem(key)));
  return names.reduce((acc, name, index) => {
    acc[name] = values[index];
    return acc;
  }, {} as Record<UserKeyName, string | null>);
}

export function parseStoredInt(raw: string | null): number | null {
  if (raw === null) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function persistString(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function persistNumber(key: string, value: number | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, String(value));
}

export async function persistJson(key: string, value: unknown | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeUserEntry(name: UserKeyName, userId: string): Promise<void> {
  await AsyncStorage.removeItem(getUserStorageKey(name, userId));
}
