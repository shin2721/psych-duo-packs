import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StreakData,
  claimRecoveryMissionIfEligible,
  dateKey,
  getRecoveryMissionStatus,
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

describe("recovery mission", () => {
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
    await seedState({ lastActionDate: null });
    const status = await getRecoveryMissionStatus();
    expect(status.eligible).toBe(false);
  });

  test("欠勤なし（diff=1）の場合は eligible=false", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await seedState({ lastActionDate: yesterday });
    const status = await getRecoveryMissionStatus();
    expect(status.eligible).toBe(false);
    expect(status.missedDays).toBe(0);
  });

  test("欠勤あり（diff>=2）の場合は eligible=true", async () => {
    const twoDaysAgo = dateKey(new Date(now - 2 * ONE_DAY_MS));
    await seedState({ lastActionDate: twoDaysAgo });
    const status = await getRecoveryMissionStatus();
    expect(status.eligible).toBe(true);
    expect(status.missedDays).toBeGreaterThanOrEqual(1);
  });

  test("recoveryLastClaimedDate=today の場合は eligible=false", async () => {
    const twoDaysAgo = dateKey(new Date(now - 2 * ONE_DAY_MS));
    await seedState({
      lastActionDate: twoDaysAgo,
      recoveryLastClaimedDate: dateKey(),
    });
    const status = await getRecoveryMissionStatus();
    expect(status.eligible).toBe(false);
    expect(status.claimedToday).toBe(true);
  });

  test("claim は同日で1回のみ成功", async () => {
    const twoDaysAgo = dateKey(new Date(now - 2 * ONE_DAY_MS));
    await seedState({
      lastActionDate: dateKey(), // executed後の状態
      recoveryLastClaimedDate: null,
    });

    const first = await claimRecoveryMissionIfEligible(twoDaysAgo);
    const second = await claimRecoveryMissionIfEligible(twoDaysAgo);

    expect(first.claimed).toBe(true);
    expect(second.claimed).toBe(false);
  });
});
