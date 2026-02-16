import AsyncStorage from "@react-native-async-storage/async-storage";
import { getQuestBoard, recordQuestEvent } from "../../lib/questsV2";

describe("quest event integration", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("lesson_completeでdaily/weekly/monthlyが進み、study_dayは同日1回のみ増える", async () => {
    const d1a = new Date("2026-02-16T09:00:00+09:00");
    const d1b = new Date("2026-02-16T20:00:00+09:00");
    const d2 = new Date("2026-02-17T09:00:00+09:00");

    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, d1a);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l02", genreId: "mental" }, d1b);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l03", genreId: "mental" }, d2);

    const board = await getQuestBoard(d2);

    expect(board.weekly.find((q) => q.id === "weekly_lessons_15")?.progress).toBe(3);
    expect(board.monthly.find((q) => q.id === "monthly_lessons_60")?.progress).toBe(3);
    expect(board.weekly.find((q) => q.id === "weekly_study_days_5")?.progress).toBe(2);
    expect(board.monthly.find((q) => q.id === "monthly_study_days_20")?.progress).toBe(2);
  });

  test("journal_submitでdaily/weekly journal questが進む", async () => {
    const day = new Date("2026-02-16T10:00:00+09:00");

    await recordQuestEvent({ type: "journal_submit" }, day);

    const board = await getQuestBoard(day);
    expect(board.daily.find((q) => q.id === "daily_journal_1")?.progress).toBe(1);
    expect(board.weekly.find((q) => q.id === "weekly_journal_3")?.progress).toBe(1);
  });
});
