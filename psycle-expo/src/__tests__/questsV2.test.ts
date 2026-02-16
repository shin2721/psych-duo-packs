import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyXpBoost,
  claimDailyBundleRewardIfEligible,
  claimQuestReward,
  getQuestBoard,
  recordQuestEvent,
} from "../../lib/questsV2";

describe("questsV2", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("日次/週次/月次サイクル切替で日次のみリセットされる", async () => {
    const day1 = new Date("2026-02-16T10:00:00+09:00");
    const day2 = new Date("2026-02-17T10:00:00+09:00");

    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, day1);
    const boardDay1 = await getQuestBoard(day1);
    expect(boardDay1.daily.find((q) => q.id === "daily_lesson_1")?.progress).toBe(1);
    expect(boardDay1.weekly.find((q) => q.id === "weekly_lessons_15")?.progress).toBe(1);

    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l02", genreId: "mental" }, day2);
    const boardDay2 = await getQuestBoard(day2);

    expect(boardDay2.daily.find((q) => q.id === "daily_lesson_1")?.progress).toBe(1);
    expect(boardDay2.weekly.find((q) => q.id === "weekly_lessons_15")?.progress).toBe(2);
    expect(boardDay2.monthly.find((q) => q.id === "monthly_lessons_60")?.progress).toBe(2);
  });

  test("日次3/3でチケット1枚のみ付与され、再claimでは付与されない", async () => {
    const day = new Date("2026-02-16T11:00:00+09:00");

    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, day);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l02", genreId: "mental" }, day);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l03", genreId: "mental" }, day);
    await recordQuestEvent({ type: "journal_submit" }, day);

    await claimQuestReward("daily_lesson_1", day);
    await claimQuestReward("daily_lesson_3", day);
    await claimQuestReward("daily_journal_1", day);

    const first = await claimDailyBundleRewardIfEligible(day);
    const second = await claimDailyBundleRewardIfEligible(day);

    expect(first.granted).toBe(true);
    expect(first.ticket?.validDate).toBe("2026-02-17");
    expect(second.granted).toBe(false);
  });

  test("boost適用時にbonus上限(+120)が効く", async () => {
    const day = new Date("2026-02-16T11:00:00+09:00");
    const nextDay = new Date("2026-02-17T09:00:00+09:00");

    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, day);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l02", genreId: "mental" }, day);
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l03", genreId: "mental" }, day);
    await recordQuestEvent({ type: "journal_submit" }, day);
    await claimQuestReward("daily_lesson_1", day);
    await claimQuestReward("daily_lesson_3", day);
    await claimQuestReward("daily_journal_1", day);
    await claimDailyBundleRewardIfEligible(day);

    const first = await applyXpBoost(100, "lesson", nextDay);
    const second = await applyXpBoost(100, "question", new Date("2026-02-17T09:05:00+09:00"));
    const third = await applyXpBoost(50, "lesson", new Date("2026-02-17T09:06:00+09:00"));

    expect(first.bonusXp).toBe(100);
    expect(first.effectiveXp).toBe(200);

    expect(second.bonusXp).toBe(20);
    expect(second.effectiveXp).toBe(120);

    expect(third.bonusXp).toBe(0);
    expect(third.effectiveXp).toBe(50);
  });
});
