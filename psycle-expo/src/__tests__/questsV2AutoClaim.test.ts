import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  autoClaimEligibleQuestRewards,
  claimDailyBundleRewardIfEligible,
  applyXpBoost,
  getQuestBoard,
  recordQuestEvent,
} from "../../lib/questsV2";

const QUEST_STORAGE_KEY = "@psycle_quests_v2";

async function completeDaily3of3(day: Date, label: string) {
  await recordQuestEvent({ type: "lesson_complete", lessonId: `${label}_l1`, genreId: "mental" }, day);
  await recordQuestEvent({ type: "lesson_complete", lessonId: `${label}_l2`, genreId: "mental" }, day);
  await recordQuestEvent({ type: "lesson_complete", lessonId: `${label}_l3`, genreId: "mental" }, day);
  await recordQuestEvent({ type: "journal_submit" }, day);
}

describe("questsV2 auto-claim", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("lesson_complete後にeligible questが自動受取される", async () => {
    const day = new Date("2026-02-16T11:00:00+09:00");
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, day);

    const result = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day });
    const board = await getQuestBoard(day);

    expect(result.claimedQuests).toContain("daily_lesson_1");
    expect(result.claimedGems).toBe(5);
    expect(board.daily.find((q) => q.id === "daily_lesson_1")?.claimed).toBe(true);
  });

  test("同条件で2回実行しても重複claimされない", async () => {
    const day = new Date("2026-02-16T11:00:00+09:00");
    await recordQuestEvent({ type: "lesson_complete", lessonId: "mental_l01", genreId: "mental" }, day);

    const first = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day });
    const second = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day });

    expect(first.claimedGems).toBe(5);
    expect(second.claimedGems).toBe(0);
    expect(second.claimedQuests.length).toBe(0);
    expect(second.weeklyFreezesGranted).toBe(0);
    expect(second.monthlyBadgeId).toBeNull();
  });

  test("daily 3/3でticket付与、primary占有時はqueueに入る", async () => {
    const day1 = new Date("2026-02-16T11:00:00+09:00");
    const day2 = new Date("2026-02-17T11:00:00+09:00");

    await completeDaily3of3(day1, "d1");
    const first = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day1 });
    expect(first.dailyTicketGranted).toBe(true);
    expect(first.dailyTicketQueued).toBe(false);

    await completeDaily3of3(day2, "d2");
    const second = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day2 });
    const board = await getQuestBoard(day2);

    expect(second.dailyTicketGranted).toBe(false);
    expect(second.dailyTicketQueued).toBe(true);
    expect(second.dailyTicketBlocked).toBe(false);
    expect(board.xpBoost.validDate).toBe("2026-02-17");
    expect(board.xpBoost.queuedValidDate).toBe("2026-02-18");
  });

  test("primary+queue満杯時は追加ticketがblockされる", async () => {
    const day = new Date("2026-02-17T11:00:00+09:00");

    await AsyncStorage.setItem(
      QUEST_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        daily: {
          cycleId: "2026-02-17",
          progress: { daily_lesson_1: 1, daily_lesson_3: 3, daily_journal_1: 1 },
          claimed: { daily_lesson_1: true, daily_lesson_3: true, daily_journal_1: true },
          studyDayMarks: [],
          bundleClaimed: false,
        },
        weekly: {
          cycleId: "2026-W08",
          progress: {},
          claimed: {},
          studyDayMarks: [],
          bundleClaimed: false,
        },
        monthly: {
          cycleId: "2026-02",
          progress: {},
          claimed: {},
          studyDayMarks: [],
          bundleClaimed: false,
        },
        xpBoostTicket: {
          validDate: "2026-02-17",
          durationMinutes: 15,
          multiplier: 2,
          maxBonusXp: 120,
          activatedAt: null,
          consumedBonusXp: 0,
        },
        queuedXpBoostTicket: {
          validDate: "2026-02-18",
          durationMinutes: 15,
          multiplier: 2,
          maxBonusXp: 120,
        },
      })
    );

    const result = await claimDailyBundleRewardIfEligible(day, { source: "lesson_complete", claimMode: "auto" });
    const board = await getQuestBoard(day);

    expect(result.granted).toBe(true);
    expect(result.blocked).toBe(true);
    expect(result.ticket).toBeUndefined();
    expect(result.queuedTicket).toBeUndefined();
    expect(board.xpBoost.validDate).toBe("2026-02-17");
    expect(board.xpBoost.queuedValidDate).toBe("2026-02-18");
  });

  test("queueが翌日に昇格し、boost適用が有効になる", async () => {
    const day1 = new Date("2026-02-16T11:00:00+09:00");
    const day2 = new Date("2026-02-17T11:00:00+09:00");
    const day3 = new Date("2026-02-18T09:00:00+09:00");

    await completeDaily3of3(day1, "p1");
    await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day1 });

    await completeDaily3of3(day2, "p2");
    const day2Claim = await autoClaimEligibleQuestRewards({ source: "lesson_complete", now: day2 });
    expect(day2Claim.dailyTicketQueued).toBe(true);

    const day3Board = await getQuestBoard(day3);
    expect(day3Board.xpBoost.validDate).toBe("2026-02-18");
    expect(day3Board.xpBoost.queuedValidDate).toBeNull();

    const boosted = await applyXpBoost(20, "lesson", new Date("2026-02-18T09:01:00+09:00"));
    expect(boosted.boostApplied).toBe(true);
    expect(boosted.bonusXp).toBe(20);
    expect(boosted.effectiveXp).toBe(40);
  });
});
