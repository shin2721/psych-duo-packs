import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StreakData,
  dateKey,
  getStudyStreakRiskStatus,
  markStreakVisibilityShown,
} from "../../lib/streaks";

const STORAGE_KEY = "@psycle_streaks";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayStr}`;
}

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
    streakVisibilityCourseLastShownDate: null,
    streakVisibilityQuestsLastShownDate: null,
    freezesRemaining: 2,
    freezeWeekStart: getWeekStart(new Date()),
    totalXP: 0,
    todayXP: 0,
    xpDate: dateKey(),
    ...partial,
  };
}

async function seedState(partial: Partial<StreakData>) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buildBaseState(partial)));
}

describe("streak visibility", () => {
  const now = new Date("2026-02-14T12:00:00.000Z").getTime();

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

  test("todayStudied=true の場合は safe_today", async () => {
    await seedState({
      lastStudyDate: dateKey(),
      studyStreak: 5,
      freezesRemaining: 1,
    });
    const status = await getStudyStreakRiskStatus();
    expect(status.riskType).toBe("safe_today");
    expect(status.todayStudied).toBe(true);
  });

  test("today未学習 && freeze>0 の場合は consume_freeze", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await seedState({
      lastStudyDate: yesterday,
      studyStreak: 3,
      freezesRemaining: 2,
    });
    const status = await getStudyStreakRiskStatus();
    expect(status.riskType).toBe("consume_freeze");
    expect(status.todayStudied).toBe(false);
  });

  test("today未学習 && freeze=0 の場合は break_streak", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await seedState({
      lastStudyDate: yesterday,
      studyStreak: 3,
      freezesRemaining: 0,
    });
    const status = await getStudyStreakRiskStatus();
    expect(status.riskType).toBe("break_streak");
    expect(status.todayStudied).toBe(false);
  });

  test("surfaceごとに1日1回だけshownを記録する", async () => {
    await seedState({});

    const courseFirst = await markStreakVisibilityShown("course_home");
    const courseSecond = await markStreakVisibilityShown("course_home");
    const questsFirst = await markStreakVisibilityShown("quests_tab");
    const questsSecond = await markStreakVisibilityShown("quests_tab");

    expect(courseFirst).toBe(true);
    expect(courseSecond).toBe(false);
    expect(questsFirst).toBe(true);
    expect(questsSecond).toBe(false);
  });
});
