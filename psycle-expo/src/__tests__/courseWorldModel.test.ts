import {
  buildCourseWorldModelSnapshot,
  buildClockItems,
  getCurrentNodeIndex,
  getNextLessonIndex,
  mergeNodes,
} from "../../components/course-world/courseWorldModel";
import type { CourseWorldViewModel } from "../../lib/courseWorld";

const model: CourseWorldViewModel = {
  currentLesson: {
    accessibilityLabel: "Current node L3",
    body: "Turn one stuck thought into motion.",
    icon: "sparkles",
    id: "l3",
    isInteractive: true,
    label: "L3",
    levelNumber: 3,
    lessonFile: "mental_l03",
    meta: "7 questions • +38 XP",
    nodeType: "lesson",
    status: "current",
    title: "Anxiety Reframe",
  },
  genreId: "mental",
  primaryAction: {
    label: "Open lesson 3",
    mode: "lesson",
    targetLessonFile: "mental_l03",
    targetNodeId: "l3",
  },
  progressLabel: "3 / 6",
  reviewNode: {
    accessibilityLabel: "Review node BH",
    icon: "planet",
    id: "bh1",
    isInteractive: false,
    label: "BH",
    levelNumber: 5,
    nodeType: "review_blackhole",
    status: "locked",
  },
  routeNodes: [
    {
      accessibilityLabel: "Done node L2",
      icon: "flower",
      id: "l2",
      isInteractive: false,
      label: "L2",
      levelNumber: 2,
      nodeType: "lesson",
      status: "done",
    },
    {
      accessibilityLabel: "Locked node L4",
      icon: "star",
      id: "l4",
      isInteractive: false,
      label: "L4",
      levelNumber: 4,
      nodeType: "lesson",
      status: "locked",
    },
  ],
  summaryLabel: "2 done • 3 left",
  supportMoment: {
    body: "Restore your streak before it expires.",
    ctaLabel: "Restore",
    kind: "streakRepair",
    title: "Streak Repair",
  },
  themeColor: "#ec4899",
  unitLabel: "メンタル",
};

describe("courseWorldModel", () => {
  test("merges and sorts route, current and review nodes", () => {
    const merged = mergeNodes(model);

    expect(merged.map((node) => node.id)).toEqual(["l2", "l3", "l4", "bh1"]);
  });

  test("computes current and next lesson indices", () => {
    const merged = mergeNodes(model);
    const currentIdx = getCurrentNodeIndex(merged, model.currentLesson.id);
    const nextLessonIdx = getNextLessonIndex(merged, "l4", currentIdx);

    expect(currentIdx).toBe(1);
    expect(nextLessonIdx).toBe(2);
  });

  test("builds clock items and snapshot summary data", () => {
    const merged = mergeNodes(model);
    const clockItems = buildClockItems(merged, 1, (2 * Math.PI) / merged.length);
    const snapshot = buildCourseWorldModelSnapshot(model, "l4");

    expect(clockItems).toHaveLength(4);
    expect(clockItems[0]?.node.id).toBe("l2");
    expect(snapshot.nextLessonIdx).toBe(2);
    expect(snapshot.doneCount).toBe(1);
    expect(snapshot.remainingCount).toBe(3);
  });
});
