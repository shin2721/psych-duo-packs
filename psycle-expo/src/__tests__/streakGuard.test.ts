import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StreakData,
  dateKey,
  getStreakGuardStatus,
  markStreakGuardSavedIfEligible,
} from "../../lib/streaks";

const STORAGE_KEY = "@psycle_streaks";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function buildBaseState(partial: Partial<StreakData> = {}): StreakData {
  return {
    studyStreak: 0,
    lastStudyDate: null,
    studyHistory: {},
    actionStreak: 0,
    lastActionDate: null,
    recoveryLastShownDate: null,
    recoveryLastClaimedDate: null,
    streakGuardLastShownDate: null,
    streakGuardLastSavedDate: null,
    leagueBoundaryLastShownDate: null,
    freezesRemaining: 2,
    freezeWeekStart: null,
    totalXP: 0,
    todayXP: 0,
    xpDate: dateKey(),
    ...partial,
  };
}

async function seedState(partial: Partial<StreakData>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buildBaseState(partial)));
}

describe("streak guard", () => {
  const now = new Date("2026-02-12T12:00:00.000Z").getTime();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("lastActionDate=null の場合は eligible=false", async () => {
    await seedState({ lastActionDate: null, actionStreak: 3 });
    const status = await getStreakGuardStatus();
    expect(status.eligible).toBe(false);
  });

  test("diff=0 の場合は eligible=false", async () => {
    await seedState({ lastActionDate: dateKey(), actionStreak: 3 });
    const status = await getStreakGuardStatus();
    expect(status.eligible).toBe(false);
  });

  test("diff=1 && actionStreak>=2 の場合は eligible=true", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await seedState({ lastActionDate: yesterday, actionStreak: 2 });
    const status = await getStreakGuardStatus();
    expect(status.eligible).toBe(true);
  });

  test("diff>=2 の場合は eligible=false", async () => {
    const twoDaysAgo = dateKey(new Date(now - 2 * ONE_DAY_MS));
    await seedState({ lastActionDate: twoDaysAgo, actionStreak: 5 });
    const status = await getStreakGuardStatus();
    expect(status.eligible).toBe(false);
  });

  test("saved は同日で1回のみ成功", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await seedState({
      lastActionDate: dateKey(), // executed後
      actionStreak: 3, // executed後の値（beforeは2）
      streakGuardLastSavedDate: null,
      freezesRemaining: 0,
    });

    const first = await markStreakGuardSavedIfEligible(yesterday);
    const second = await markStreakGuardSavedIfEligible(yesterday);

    expect(first.saved).toBe(true);
    expect(second.saved).toBe(false);
  });
});
