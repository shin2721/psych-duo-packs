import AsyncStorage from "@react-native-async-storage/async-storage";
import { dateKey } from "../../lib/streaks";
import {
  getActionJournalComposer,
  recordLessonCompletionForJournal,
} from "../../lib/actionJournal";

jest.mock("../../lib/lessons", () => ({
  loadLessons: (unit: string) => {
    if (unit !== "mental") return [];
    return [
      {
        id: "mental_l01",
        unit: "mental",
        level: 1,
        nodeType: "lesson",
        title: "L1",
        totalXP: 50,
        questions: [{ id: "q1", expanded_details: { claim_type: "intervention", try_this: "10秒呼吸" } }],
      },
      {
        id: "mental_l02",
        unit: "mental",
        level: 2,
        nodeType: "lesson",
        title: "L2",
        totalXP: 50,
        questions: [{ id: "q2", expanded_details: { claim_type: "intervention", try_this: "姿勢を正す" } }],
      },
      {
        id: "mental_l03",
        unit: "mental",
        level: 3,
        nodeType: "lesson",
        title: "L3",
        totalXP: 50,
        questions: [{ id: "q3", expanded_details: { claim_type: "intervention", try_this: "短い散歩" } }],
      },
      {
        id: "mental_l04",
        unit: "mental",
        level: 4,
        nodeType: "lesson",
        title: "L4",
        totalXP: 50,
        questions: [{ id: "q4", expanded_details: { claim_type: "intervention", try_this: "窓際で深呼吸" } }],
      },
    ];
  },
}));

const STORAGE_KEY = "@psycle_action_journal_v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("action journal ranking", () => {
  const now = new Date("2026-02-16T12:00:00.000Z").getTime();

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

  test("not_triedは末尾固定、positionは1始まりで採番される", async () => {
    await recordLessonCompletionForJournal("mental_l01", "mental");
    await recordLessonCompletionForJournal("mental_l02", "mental");
    await recordLessonCompletionForJournal("mental_l03", "mental");
    await recordLessonCompletionForJournal("mental_l04", "mental");

    const composer = await getActionJournalComposer("mental");
    const last = composer.tryOptions[composer.tryOptions.length - 1];

    expect(last?.id).toBe("not_tried");
    composer.tryOptions.forEach((option, index) => {
      expect(option.position).toBe(index + 1);
    });
  });

  test("先頭3件はnot_tried以外になる", async () => {
    const composer = await getActionJournalComposer("mental");
    const topThree = composer.tryOptions.slice(0, 3);
    expect(topThree.every((option) => option.id !== "not_tried")).toBe(true);
  });

  test("positive_historyはrecent/fallbackより優先される", async () => {
    const yesterday = dateKey(new Date(now - ONE_DAY_MS));
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        lessonHistory: [
          { lessonId: "mental_l01", genreId: "mental", completedAt: new Date(now - 1000).toISOString(), date: dateKey() },
          { lessonId: "mental_l02", genreId: "mental", completedAt: new Date(now - 2000).toISOString(), date: dateKey() },
        ],
        entries: {
          [yesterday]: {
            date: yesterday,
            genreId: "mental",
            tryOptionId: "try:姿勢を正す",
            tryLabel: "姿勢を正す",
            result: 2,
            note: null,
            rewardedXp: true,
            submittedAt: new Date(now - ONE_DAY_MS).toISOString(),
            updatedAt: new Date(now - ONE_DAY_MS).toISOString(),
          },
        },
      })
    );

    const composer = await getActionJournalComposer("mental");
    const first = composer.tryOptions[0];
    expect(first?.origin).toBe("positive_history");
    expect(first?.id).toBe("try:姿勢を正す");
  });
});

