export const SWIPE_HORIZONTAL_INTENT_DISTANCE = 6;
export const SWIPE_COMMIT_DISTANCE = 44;
export const SWIPE_FAST_FLICK_DISTANCE = 18;
export const SWIPE_FAST_FLICK_VELOCITY = 0.45;
export const SWIPE_DIRECTION_DOMINANCE = 1.2;

export interface SwipeJudgmentGestureState {
  dx: number;
  dy: number;
  vx: number;
}

export function hasHorizontalSwipeIntent(
  gesture: Pick<SwipeJudgmentGestureState, "dx" | "dy">
): boolean {
  const absX = Math.abs(gesture.dx);
  const absY = Math.abs(gesture.dy);

  return (
    absX >= SWIPE_HORIZONTAL_INTENT_DISTANCE &&
    absX > absY * SWIPE_DIRECTION_DOMINANCE
  );
}

export function resolveSwipeJudgmentDirection(
  gesture: SwipeJudgmentGestureState
): "left" | "right" | null {
  if (!hasHorizontalSwipeIntent(gesture)) return null;

  const absX = Math.abs(gesture.dx);
  const committedByDistance = absX >= SWIPE_COMMIT_DISTANCE;
  const committedByFlick =
    absX >= SWIPE_FAST_FLICK_DISTANCE &&
    Math.abs(gesture.vx) >= SWIPE_FAST_FLICK_VELOCITY;

  if (!committedByDistance && !committedByFlick) return null;
  return gesture.dx < 0 ? "left" : "right";
}
