import type { TrailNode, TrailNodePosition } from "./types";

export const NODE_SIZE = 64;
export const MILESTONE_NODE_SIZE = 72;
export const NODE_SPACING = 120;
export const PATH_COLOR_DONE = "#22c55e";
export const PATH_COLOR_FUTURE = "rgba(255,255,255,0.15)";
export const GLOW_COLOR = "#a8ff60";
export const GLOW_COLOR_BRIGHT = "#eaff00";
export const FIREFLY_COLORS = ["#a8ff60", "#ffdd60", "#ff9b60", "#ffdd60", "#60ffb0", "#ffaa40"] as const;

export function getCurrentNodeIndex(trail: TrailNode[]): number {
  return trail.findIndex((node) => node.status === "current");
}

export function getTrailNodePositions(trailLength: number, screenWidth: number): TrailNodePosition[] {
  const centerX = screenWidth / 2;
  const maxAmplitude = screenWidth / 2 - MILESTONE_NODE_SIZE - 16;

  return Array.from({ length: trailLength }, (_, index) => ({
    x: centerX + Math.sin(index * Math.PI - Math.PI / 2) * maxAmplitude,
    y: 80 + index * NODE_SPACING,
  }));
}

export function buildTrailPaths(
  nodePositions: TrailNodePosition[],
  currentIndex: number
): { pathDone: string; pathFuture: string } {
  if (nodePositions.length < 2) {
    return { pathDone: "", pathFuture: "" };
  }

  let pathDone = "";
  let pathFuture = "";

  for (let index = 0; index < nodePositions.length; index += 1) {
    const currentPosition = nodePositions[index];

    if (index === 0) {
      if (currentIndex >= 0) {
        pathDone = `M ${currentPosition.x} ${currentPosition.y}`;
      }
      pathFuture = `M ${currentPosition.x} ${currentPosition.y}`;
      continue;
    }

    const previousPosition = nodePositions[index - 1];
    const controlPointY = (previousPosition.y + currentPosition.y) / 2;
    const segment = ` C ${previousPosition.x} ${controlPointY}, ${currentPosition.x} ${controlPointY}, ${currentPosition.x} ${currentPosition.y}`;

    if (index <= currentIndex) {
      pathDone += segment;
    }
    pathFuture += segment;
  }

  return { pathDone, pathFuture };
}

export function isMilestoneIndex(index: number): boolean {
  return (index + 1) % 5 === 0;
}
