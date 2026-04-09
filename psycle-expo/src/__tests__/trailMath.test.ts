import {
  buildTrailPaths,
  getCurrentNodeIndex,
  getTrailNodePositions,
  isMilestoneIndex,
} from "../../components/trail/trailMath";
import type { TrailNode } from "../../components/trail/types";

describe("trailMath", () => {
  test("computes node positions on an alternating centered path", () => {
    const positions = getTrailNodePositions(3, 390);

    expect(positions).toHaveLength(3);
    expect(positions[0]).toEqual({ x: 88, y: 80 });
    expect(positions[1].y).toBe(200);
    expect(positions[2].y).toBe(320);
  });

  test("finds the current node index and builds split paths", () => {
    const trail: TrailNode[] = [
      { id: "l1", icon: "leaf", status: "done" },
      { id: "l2", icon: "sparkles", status: "current" },
      { id: "l3", icon: "star", status: "locked" },
    ];
    const currentIndex = getCurrentNodeIndex(trail);
    const positions = getTrailNodePositions(trail.length, 390);
    const paths = buildTrailPaths(positions, currentIndex);

    expect(currentIndex).toBe(1);
    expect(paths.pathDone).toContain("C");
    expect(paths.pathFuture).toContain("C");
    expect(paths.pathDone).not.toBe(paths.pathFuture);
  });

  test("marks every fifth node as a milestone", () => {
    expect(isMilestoneIndex(0)).toBe(false);
    expect(isMilestoneIndex(3)).toBe(false);
    expect(isMilestoneIndex(4)).toBe(true);
    expect(isMilestoneIndex(9)).toBe(true);
  });
});
