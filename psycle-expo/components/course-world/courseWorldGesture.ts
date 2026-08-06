export const COURSE_WORLD_DRAG_THRESHOLD = 6;

export function isCourseWorldDrag(dx: number, dy: number): boolean {
  return Math.abs(dx) > COURSE_WORLD_DRAG_THRESHOLD || Math.abs(dy) > COURSE_WORLD_DRAG_THRESHOLD;
}

export function courseWorldRotationForDrag(dx: number, width: number, nodeCount: number): number {
  const dragWidthFactor = nodeCount <= 2 ? 0.24 : 0.35;
  return (dx / (width * dragWidthFactor)) * Math.PI;
}

export function resolveCourseWorldRelease({
  currentIdx,
  dx,
  nodeCount,
  rawRotation,
  velocityX,
  width,
}: {
  currentIdx: number;
  dx: number;
  nodeCount: number;
  rawRotation?: number;
  velocityX: number;
  width: number;
}): { nextIndex: number; slotOffset: number; snapOffset: number } {
  const safeNodeCount = Math.max(nodeCount, 1);
  const anglePerLesson = (2 * Math.PI) / safeNodeCount;
  const releaseRotation = rawRotation ?? courseWorldRotationForDrag(dx, width, safeNodeCount);
  const totalAngle = releaseRotation + velocityX * 0.5;
  const slotOffset = Math.round(totalAngle / anglePerLesson);
  const nextIndex = ((currentIdx - slotOffset) % safeNodeCount + safeNodeCount) % safeNodeCount;

  return {
    nextIndex,
    slotOffset,
    snapOffset: slotOffset * anglePerLesson,
  };
}
