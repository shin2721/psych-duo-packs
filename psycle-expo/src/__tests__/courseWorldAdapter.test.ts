const mockLoadLessons = jest.fn();

jest.mock("../../lib/lessons", () => ({
  loadLessons: (...args: unknown[]) => mockLoadLessons(...args),
}));

jest.mock("../../lib/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string, params: Record<string, unknown> = {}) => {
      switch (key) {
        case "course.world.reviewBody":
          return "Review body";
        case "course.world.lockedBody":
          return "Locked body";
        case "course.world.lessonBodyFallback":
          return "Fallback body";
        case "course.world.progressReview":
          return "Review";
        case "course.world.ctaOpenReview":
          return "Open review";
        case "course.world.ctaSeeUnlock":
          return "See unlock options";
        case "course.world.ctaOpenLesson":
          return `Open lesson ${params.number}`;
        case "course.world.metaQuestionsXp":
          return `${params.count} questions • +${params.xp} XP`;
        case "course.world.summary":
          return `${params.done} done • ${params.remaining} left`;
        case "course.streakRepair.title":
          return "Streak Repair";
        case "course.streakRepair.body":
          return `Restore ${params.streak} within ${params.hours}h for ${params.cost}`;
        case "course.streakRepair.cta":
          return "Restore";
        case "course.streakRepair.accessibilityHint":
          return "Repair hint";
        case "course.comebackReward.title":
          return "Welcome Back";
        case "course.comebackReward.body":
          return `Back after ${params.days} days`;
        case "course.comebackReward.accessibilityHint":
          return "Comeback hint";
        case "course.accessibility.nodeCurrent":
          return `Current node ${params.number}`;
        case "course.accessibility.nodeLocked":
          return `Locked node ${params.number}`;
        case "course.accessibility.nodeCompleted":
          return `Done node ${params.number}`;
        case "course.accessibility.nodeReview":
          return `Review node ${params.label}`;
        default:
          return key;
      }
    },
  },
}));

import { buildCourseWorldViewModel } from "../../lib/courseWorld";

const mockLessons = [
  {
    id: "mental_lesson_1",
    level: 1,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Breathe once and settle." }],
    title: "Lesson 1",
    totalXP: 24,
    unit: "mental",
  },
  {
    id: "mental_lesson_2",
    level: 2,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Name the signal." }],
    title: "Lesson 2",
    totalXP: 28,
    unit: "mental",
  },
  {
    id: "mental_lesson_3",
    level: 3,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Reframe one stuck thought." }],
    title: "Lesson 3",
    totalXP: 38,
    unit: "mental",
  },
  {
    id: "mental_lesson_4",
    level: 4,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Compare the evidence." }],
    title: "Lesson 4",
    totalXP: 40,
    unit: "mental",
  },
  {
    id: "mental_lesson_5",
    level: 5,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Shrink the next action." }],
    title: "Lesson 5",
    totalXP: 42,
    unit: "mental",
  },
  {
    id: "mental_review_bh1",
    level: 5.5,
    nodeType: "review_blackhole",
    questions: [{ actionable_advice: " Review the weak spots." }],
    title: "Black Hole Review",
    totalXP: 100,
    unit: "mental",
  },
  {
    id: "mental_lesson_6",
    level: 6,
    nodeType: "lesson",
    questions: [{ actionable_advice: " Loosen perfection." }],
    title: "Lesson 6",
    totalXP: 44,
    unit: "mental",
  },
] as const;

function createTrail() {
  return [
    { icon: "leaf", id: "m1", lessonFile: "mental_l01", status: "done", type: "lesson" },
    { icon: "flower", id: "m2", lessonFile: "mental_l02", status: "done", type: "lesson" },
    { icon: "sparkles", id: "m3", lessonFile: "mental_l03", status: "current", type: "lesson" },
    { icon: "star", id: "m4", lessonFile: "mental_l04", status: "locked", type: "lesson" },
    { icon: "heart-circle", id: "m5", lessonFile: "mental_l05", status: "locked", type: "lesson" },
    { icon: "planet", id: "bh1", lessonFile: "mental_review_bh1", status: "locked", type: "review_blackhole" },
    { icon: "pulse", id: "m6", lessonFile: "mental_l06", status: "locked", type: "lesson" },
  ];
}

describe("buildCourseWorldViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadLessons.mockReturnValue(mockLessons);
  });

  test("unlocked current lesson uses lesson primary action", () => {
    const trail = createTrail();
    const model = buildCourseWorldViewModel({
      comebackRewardOffer: null,
      currentTrail: trail,
      nextActionNode: trail[2],
      selectedGenre: "mental",
      streakRepairOffer: null,
    });

    expect(model?.primaryAction.mode).toBe("lesson");
    expect(model?.primaryAction.label).toBe("Open lesson 3");
    expect(model?.progressLabel).toBe("3 / 6");
    expect(model?.currentLesson.body).toBe("Reframe one stuck thought.");
  });

  test("locked current lesson uses paywall primary action", () => {
    const trail = createTrail();
    trail[5] = { ...trail[5], status: "done" };
    trail[6] = { ...trail[6], isLocked: true, status: "current" };

    const model = buildCourseWorldViewModel({
      comebackRewardOffer: null,
      currentTrail: trail,
      nextActionNode: trail[6],
      selectedGenre: "mental",
      streakRepairOffer: null,
    });

    expect(model?.primaryAction.mode).toBe("paywall");
    expect(model?.currentLesson.status).toBe("locked");
    expect(model?.currentLesson.body).toBe("Locked body");
  });

  test("streak repair support moment wins over comeback reward", () => {
    const trail = createTrail();
    const model = buildCourseWorldViewModel({
      comebackRewardOffer: {
        active: true,
        daysSinceStudy: 8,
        expiresAtMs: 10_000,
        rewardEnergy: 2,
        rewardGems: 10,
        triggerDate: "2026-03-18",
      },
      currentTrail: trail,
      nextActionNode: trail[2],
      nowMs: 1_000,
      selectedGenre: "mental",
      streakRepairOffer: {
        active: true,
        costGems: 50,
        expiresAtMs: 3_600_000,
        previousStreak: 14,
      },
    });

    expect(model?.supportMoment?.kind).toBe("streakRepair");
    expect(model?.supportMoment?.ctaLabel).toBe("Restore");
  });

  test("review current node switches the primary mode to review", () => {
    const trail = createTrail();
    trail[2] = { ...trail[2], status: "done" };
    trail[3] = { ...trail[3], status: "done" };
    trail[4] = { ...trail[4], status: "done" };
    trail[5] = { ...trail[5], status: "current" };

    const model = buildCourseWorldViewModel({
      comebackRewardOffer: null,
      currentTrail: trail,
      nextActionNode: trail[5],
      selectedGenre: "mental",
      streakRepairOffer: null,
    });

    expect(model?.primaryAction.mode).toBe("review");
    expect(model?.currentLesson.nodeType).toBe("review_blackhole");
    expect(model?.progressLabel).toBe("Review");
    expect(model?.reviewNode).toBeUndefined();
  });
});
