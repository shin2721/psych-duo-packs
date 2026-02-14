import AsyncStorage from "@react-native-async-storage/async-storage";
import { StreakData, dateKey, markLeagueSprintShown } from "../../lib/streaks";

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
    leagueSprintLastShownDate: null,
    leagueSprintLastShownWeekId: null,
    streakVisibilityCourseLastShownDate: null,
    streakVisibilityQuestsLastShownDate: null,
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

describe("league sprint shown control", () => {
  const now = new Date("2026-03-15T12:00:00.000Z").getTime();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("同日同週2回目は false", async () => {
    await seedState({});

    const first = await markLeagueSprintShown("2026-W11");
    const second = await markLeagueSprintShown("2026-W11");

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  test("翌日は同週でも true", async () => {
    await seedState({
      leagueSprintLastShownDate: dateKey(),
      leagueSprintLastShownWeekId: "2026-W11",
    });
    jest.setSystemTime(now + ONE_DAY_MS);

    const nextDay = await markLeagueSprintShown("2026-W11");
    expect(nextDay).toBe(true);
  });

  test("同日でも週が変われば true", async () => {
    await seedState({
      leagueSprintLastShownDate: dateKey(),
      leagueSprintLastShownWeekId: "2026-W11",
    });

    const nextWeek = await markLeagueSprintShown("2026-W12");
    expect(nextWeek).toBe(true);
  });
});
