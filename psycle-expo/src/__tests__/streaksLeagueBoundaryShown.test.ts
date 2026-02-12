import AsyncStorage from "@react-native-async-storage/async-storage";
import { StreakData, dateKey, markLeagueBoundaryShown } from "../../lib/streaks";

const STORAGE_KEY = "@psycle_streaks";

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

describe("league boundary shown control", () => {
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

  test("markLeagueBoundaryShown は同日2回目に false を返す", async () => {
    await seedState({ leagueBoundaryLastShownDate: null });

    const first = await markLeagueBoundaryShown();
    const second = await markLeagueBoundaryShown();

    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
