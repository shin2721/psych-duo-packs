import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../../lib/lessons", () => ({
  loadLessons: (unit: string) => {
    if (unit === "mental") {
      return [
        {
          id: "mental_l01",
          unit: "mental",
          level: 1,
          nodeType: "lesson",
          title: "L1",
          totalXP: 50,
          questions: [
            {
              id: "q1",
              expanded_details: { claim_type: "intervention", try_this: "🧘 10秒 呼吸" },
            },
            {
              id: "q2",
              expanded_details: { claim_type: "intervention", try_this: "10秒   呼吸" },
            },
          ],
        },
        {
          id: "mental_l02",
          unit: "mental",
          level: 2,
          nodeType: "lesson",
          title: "L2",
          totalXP: 50,
          questions: [
            {
              id: "q3",
              expanded_details: { claim_type: "intervention", try_this: "姿勢を正す" },
            },
          ],
        },
        {
          id: "mental_l03",
          unit: "mental",
          level: 3,
          nodeType: "lesson",
          title: "L3",
          totalXP: 50,
          questions: [
            {
              id: "q4",
              expanded_details: { claim_type: "intervention", try_this: "短い散歩" },
            },
          ],
        },
        {
          id: "mental_l04",
          unit: "mental",
          level: 4,
          nodeType: "lesson",
          title: "L4",
          totalXP: 50,
          questions: [
            {
              id: "q5",
              expanded_details: { claim_type: "intervention", try_this: "一口メモ" },
            },
          ],
        },
        {
          id: "mental_l05",
          unit: "mental",
          level: 5,
          nodeType: "lesson",
          title: "L5",
          totalXP: 50,
          questions: [
            {
              id: "q6",
              expanded_details: { claim_type: "intervention", try_this: "温かい飲み物を飲む" },
            },
          ],
        },
      ];
    }

    if (unit === "work") {
      return [
        {
          id: "work_l01",
          unit: "work",
          level: 1,
          nodeType: "lesson",
          title: "W1",
          totalXP: 50,
          questions: [
            {
              id: "wq1",
              expanded_details: { claim_type: "intervention", try_this: "5分だけ着手" },
            },
          ],
        },
      ];
    }

    return [];
  },
}));

import {
  getActionJournalComposer,
  recordLessonCompletionForJournal,
  submitActionJournal,
} from "../../lib/actionJournal";
import { dateKey } from "../../lib/streaks";

const STORAGE_KEY = "@psycle_action_journal_v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("action journal", () => {
  const now = new Date("2026-02-13T12:00:00.000Z").getTime();

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

  test("直近5レッスンから候補を生成し、最大4件(not_tried含む)になる", async () => {
    await recordLessonCompletionForJournal("mental_l01", "mental");
    await recordLessonCompletionForJournal("mental_l02", "mental");
    await recordLessonCompletionForJournal("mental_l03", "mental");
    await recordLessonCompletionForJournal("mental_l04", "mental");
    await recordLessonCompletionForJournal("mental_l05", "mental");

    const composer = await getActionJournalComposer("mental");

    expect(composer.tryOptions.length).toBeLessThanOrEqual(4);
    expect(composer.tryOptions.some((option) => option.id === "not_tried")).toBe(true);
  });

  test("重複try_thisは正規化で統合される", async () => {
    await recordLessonCompletionForJournal("mental_l01", "mental");

    const composer = await getActionJournalComposer("mental");
    const labels = composer.tryOptions
      .filter((option) => option.id !== "not_tried")
      .map((option) => option.label);

    expect(labels.filter((label) => label === "10秒 呼吸").length).toBe(1);
  });

  test("候補不足時はgenre fallbackとnot_triedが入る", async () => {
    const composer = await getActionJournalComposer("work");

    expect(composer.tryOptions.some((option) => option.origin === "genre_fallback")).toBe(true);
    expect(composer.tryOptions.some((option) => option.origin === "not_tried")).toBe(true);
  });

  test("過去30日ポジティブ履歴があるとpositive_history候補が補充される", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        lessonHistory: [],
        entries: {
          [yesterday]: {
            date: yesterday,
            genreId: "mental",
            tryOptionId: "try:10秒 呼吸",
            tryLabel: "10秒 呼吸",
            result: 1,
            note: null,
            rewardedXp: true,
            submittedAt: new Date(now - ONE_DAY_MS).toISOString(),
            updatedAt: new Date(now - ONE_DAY_MS).toISOString(),
          },
        },
      })
    );

    const composer = await getActionJournalComposer("mental");
    expect(composer.tryOptions.some((option) => option.origin === "positive_history")).toBe(true);
  });

  test("初回投稿のみXP付与、同日更新はXPなし", async () => {
    const composer = await getActionJournalComposer("mental");
    const option = composer.tryOptions.find((item) => item.id !== "not_tried");
    expect(option).toBeTruthy();

    const first = await submitActionJournal({
      genreId: "mental",
      tryOptionId: option!.id,
      tryLabel: option!.label,
      result: 1,
      note: "first",
    });
    const second = await submitActionJournal({
      genreId: "mental",
      tryOptionId: option!.id,
      tryLabel: option!.label,
      result: 2,
      note: "updated",
    });

    expect(first.created).toBe(true);
    expect(first.xpAwarded).toBe(true);
    expect(first.rewardXp).toBe(20);
    expect(second.updated).toBe(true);
    expect(second.xpAwarded).toBe(false);
    expect(second.rewardXp).toBe(0);
  });

  test("not_tried選択時はresult=not_triedのみ許可", async () => {
    await expect(
      submitActionJournal({
        genreId: "mental",
        tryOptionId: "not_tried",
        tryLabel: "not_tried",
        result: 0,
      })
    ).rejects.toThrow("Invalid result for not_tried option");

    const composer = await getActionJournalComposer("mental");
    const normalOption = composer.tryOptions.find((item) => item.id !== "not_tried");
    expect(normalOption).toBeTruthy();

    await expect(
      submitActionJournal({
        genreId: "mental",
        tryOptionId: normalOption!.id,
        tryLabel: normalOption!.label,
        result: "not_tried",
      })
    ).rejects.toThrow("not_tried result requires not_tried option");
  });
});
