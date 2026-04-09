import type { CourseWorldNode, CourseWorldViewModel } from "../../lib/courseWorld";

export const COURSE_WORLD_RING_SIZE = 220;
export const COURSE_WORLD_RING_RADIUS = 95;
export const COURSE_WORLD_RING_STROKE = 10;
export const COURSE_WORLD_RING_CX = COURSE_WORLD_RING_SIZE / 2;
export const COURSE_WORLD_RING_CY = COURSE_WORLD_RING_SIZE / 2;
export const COURSE_WORLD_RING_CIRCUMFERENCE = 2 * Math.PI * COURSE_WORLD_RING_RADIUS;
export const COURSE_WORLD_CLOCK_RING_SIZE = 130;
export const COURSE_WORLD_CLOCK_RADIUS = 160;

export const COURSE_WORLD_SYNAPSE: Record<string, string> = {
  mental: "#A78BFA",
  money: "#FCD34D",
  work: "#22D3EE",
  health: "#F472B6",
  social: "#FB923C",
  study: "#34D399",
};

export interface CourseWorldClockItem {
  node: CourseWorldNode;
  baseAngle: number;
  index: number;
}

export interface CourseWorldModelSnapshot {
  allNodes: CourseWorldNode[];
  currentIdx: number;
  nextLessonIdx: number;
  progress: number;
  doneCount: number;
  remainingCount: number;
  synColor: string;
  clockItems: CourseWorldClockItem[];
}

export function mergeNodes(model: CourseWorldViewModel): CourseWorldNode[] {
  const nodes = new Map<string, CourseWorldNode>();

  model.routeNodes.forEach((node) => {
    nodes.set(node.id, node);
  });
  nodes.set(model.currentLesson.id, model.currentLesson);

  if (model.reviewNode) {
    nodes.set(model.reviewNode.id, model.reviewNode);
  }

  return [...nodes.values()].sort((left, right) => left.levelNumber - right.levelNumber);
}

export function getCurrentNodeIndex(nodes: CourseWorldNode[], currentNodeId: string): number {
  return Math.max(
    0,
    nodes.findIndex((node) => node.id === currentNodeId)
  );
}

export function getNextLessonIndex(
  nodes: CourseWorldNode[],
  nextLessonId: string | undefined,
  currentIdx: number
): number {
  if (nextLessonId) {
    const nextIndex = nodes.findIndex((node) => node.id === nextLessonId);
    if (nextIndex >= 0) return nextIndex;
  }

  const firstInteractiveIndex = nodes.findIndex(
    (node) => node.status === "current" || (!node.isLocked && node.status !== "done")
  );

  return firstInteractiveIndex >= 0 ? firstInteractiveIndex : currentIdx;
}

export function buildClockItems(
  nodes: CourseWorldNode[],
  currentIdx: number,
  anglePerLesson: number
): CourseWorldClockItem[] {
  return nodes.map((node, index) => ({
    node,
    baseAngle: -Math.PI / 2 + (index - currentIdx) * anglePerLesson,
    index,
  }));
}

export function buildCourseWorldModelSnapshot(
  model: CourseWorldViewModel,
  nextLessonId?: string
): CourseWorldModelSnapshot {
  const allNodes = mergeNodes(model);
  const doneCount = allNodes.filter((node) => node.status === "done").length;
  const progress = allNodes.length > 0 ? doneCount / allNodes.length : 0;
  const currentIdx = getCurrentNodeIndex(allNodes, model.currentLesson.id);
  const anglePerLesson = allNodes.length > 0 ? (2 * Math.PI) / allNodes.length : 1;
  const nextLessonIdx = getNextLessonIndex(allNodes, nextLessonId, currentIdx);

  return {
    allNodes,
    currentIdx,
    nextLessonIdx,
    progress,
    doneCount,
    remainingCount: Math.max(0, allNodes.length - doneCount),
    synColor: COURSE_WORLD_SYNAPSE[model.genreId] ?? "#A78BFA",
    clockItems: buildClockItems(allNodes, currentIdx, anglePerLesson),
  };
}
