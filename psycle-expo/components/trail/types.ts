export type NodeStatus = "done" | "current" | "locked" | "future";
export type NodeType = "lesson" | "game" | "review_blackhole";

export interface TrailNode {
  id: string;
  status: NodeStatus;
  icon: string;
  type?: NodeType;
  gameId?: string;
  lessonId?: string;
  lessonFile?: string;
  isLocked?: boolean;
}

export interface TrailProps {
  trail: TrailNode[];
  hideLabels?: boolean;
  onStart?: (nodeId: string) => void;
  onLockedPress?: (nodeId: string) => void;
  themeColor?: string;
}

export interface TrailNodePosition {
  x: number;
  y: number;
}
