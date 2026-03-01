import { buildMistakesHubSessionItems } from "../features/mistakesHub";

describe("mistakesHub session item resolution", () => {
  const now = new Date("2026-03-01T10:00:00.000Z").getTime();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test("resolves latest lessonId for each selected item", () => {
    const events = [
      {
        userId: "u1",
        itemId: "q1",
        lessonId: "mental_lesson_1",
        ts: now - 60_000,
        result: "incorrect" as const,
        tags: ["results"],
      },
      {
        userId: "u1",
        itemId: "q1",
        lessonId: "mental_lesson_2",
        ts: now - 10_000,
        result: "incorrect" as const,
        tags: ["results"],
      },
      {
        userId: "u1",
        itemId: "q2",
        lessonId: "money_lesson_1",
        ts: now - 20_000,
        result: "incorrect" as const,
        tags: ["methods"],
      },
      {
        userId: "u1",
        itemId: "q3",
        lessonId: "work_lesson_1",
        ts: now - 30_000,
        result: "incorrect" as const,
        tags: ["background"],
      },
      {
        userId: "u1",
        itemId: "q4",
        lessonId: "health_lesson_1",
        ts: now - 40_000,
        result: "incorrect" as const,
        tags: ["discussion"],
      },
      {
        userId: "u1",
        itemId: "q5",
        lessonId: "social_lesson_1",
        ts: now - 50_000,
        result: "incorrect" as const,
        tags: ["results"],
      },
    ];

    const sessionItems = buildMistakesHubSessionItems(events);
    const q1 = sessionItems.find((item) => item.itemId === "q1");

    expect(sessionItems.length).toBeGreaterThanOrEqual(5);
    expect(q1?.lessonId).toBe("mental_lesson_2");
  });

  test("excludes items that cannot resolve lessonId", () => {
    const events = [
      {
        userId: "u1",
        itemId: "q1",
        ts: now - 60_000,
        result: "incorrect" as const,
        tags: ["results"],
      },
      {
        userId: "u1",
        itemId: "q2",
        lessonId: "money_lesson_1",
        ts: now - 10_000,
        result: "incorrect" as const,
        tags: ["methods"],
      },
    ];

    const sessionItems = buildMistakesHubSessionItems(events);

    expect(sessionItems.find((item) => item.itemId === "q1")).toBeUndefined();
    expect(sessionItems.find((item) => item.itemId === "q2")?.lessonId).toBe("money_lesson_1");
  });

  test("caps session items to max size (10)", () => {
    const events = Array.from({ length: 20 }, (_, index) => ({
      userId: "u1",
      itemId: `q${index}`,
      lessonId: "mental_lesson_1",
      ts: now - index * 1_000,
      result: "incorrect" as const,
      tags: ["results"],
    }));

    const sessionItems = buildMistakesHubSessionItems(events);
    expect(sessionItems.length).toBeLessThanOrEqual(10);
  });
});
