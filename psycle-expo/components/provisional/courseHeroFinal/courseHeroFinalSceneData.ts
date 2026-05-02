export type StrandSpec = {
  color: string;
  end: number;
  opacity: number;
  top: number;
  width: number;
  x: number;
};

export type OrbSpec = {
  color: string;
  opacity: number;
  size: number;
  x: number;
  y: number;
};

export type PoolSpec = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type BlossomSpec = {
  opacity: number;
  size: number;
  x: number;
  y: number;
};

export const CANOPY_ORBS: OrbSpec[] = [
  { color: "rgba(116, 90, 255, 0.12)", opacity: 1, size: 76, x: 0.03, y: 0.06 },
  { color: "rgba(149, 91, 255, 0.12)", opacity: 1, size: 92, x: 0.18, y: 0.09 },
  { color: "rgba(90, 179, 255, 0.12)", opacity: 1, size: 108, x: 0.34, y: 0.1 },
  { color: "rgba(255, 88, 225, 0.12)", opacity: 1, size: 72, x: 0.56, y: 0.08 },
  { color: "rgba(177, 118, 255, 0.12)", opacity: 1, size: 98, x: 0.69, y: 0.1 },
  { color: "rgba(89, 196, 255, 0.12)", opacity: 1, size: 86, x: 0.83, y: 0.09 },
  { color: "rgba(255, 97, 231, 0.1)", opacity: 1, size: 64, x: 0.25, y: 0.16 },
  { color: "rgba(92, 215, 255, 0.1)", opacity: 1, size: 84, x: 0.47, y: 0.17 },
  { color: "rgba(135, 105, 255, 0.1)", opacity: 1, size: 62, x: 0.74, y: 0.16 },
];

export const STRANDS: StrandSpec[] = [
  { x: 0.04, top: 0.12, end: 0.83, width: 1.5, opacity: 0.3, color: "#64d9ff" },
  { x: 0.07, top: 0.1, end: 0.75, width: 1.2, opacity: 0.18, color: "#8f7dff" },
  { x: 0.09, top: 0.15, end: 0.84, width: 1.6, opacity: 0.26, color: "#ff7ce5" },
  { x: 0.12, top: 0.11, end: 0.78, width: 1.4, opacity: 0.24, color: "#89e7ff" },
  { x: 0.15, top: 0.14, end: 0.76, width: 1.8, opacity: 0.24, color: "#74d3ff" },
  { x: 0.18, top: 0.18, end: 0.82, width: 1.4, opacity: 0.2, color: "#b48cff" },
  { x: 0.21, top: 0.12, end: 0.8, width: 1.4, opacity: 0.22, color: "#7ad1ff" },
  { x: 0.24, top: 0.16, end: 0.71, width: 1.2, opacity: 0.16, color: "#ff7ff0" },
  { x: 0.28, top: 0.12, end: 0.84, width: 1.9, opacity: 0.22, color: "#7fe3ff" },
  { x: 0.31, top: 0.17, end: 0.79, width: 1.3, opacity: 0.18, color: "#9e7bff" },
  { x: 0.35, top: 0.14, end: 0.77, width: 1.2, opacity: 0.18, color: "#77d4ff" },
  { x: 0.39, top: 0.11, end: 0.83, width: 1.7, opacity: 0.22, color: "#91ecff" },
  { x: 0.42, top: 0.13, end: 0.68, width: 1.2, opacity: 0.16, color: "#c285ff" },
  { x: 0.45, top: 0.1, end: 0.86, width: 1.8, opacity: 0.22, color: "#79e0ff" },
  { x: 0.48, top: 0.12, end: 0.79, width: 1.6, opacity: 0.22, color: "#9eeeff" },
  { x: 0.52, top: 0.14, end: 0.82, width: 1.4, opacity: 0.18, color: "#ff84ea" },
  { x: 0.55, top: 0.12, end: 0.84, width: 1.6, opacity: 0.26, color: "#83dfff" },
  { x: 0.58, top: 0.18, end: 0.72, width: 1.2, opacity: 0.16, color: "#846fff" },
  { x: 0.61, top: 0.14, end: 0.79, width: 1.7, opacity: 0.2, color: "#74e1ff" },
  { x: 0.64, top: 0.1, end: 0.83, width: 1.4, opacity: 0.22, color: "#9be8ff" },
  { x: 0.68, top: 0.13, end: 0.8, width: 1.2, opacity: 0.18, color: "#c18dff" },
  { x: 0.72, top: 0.16, end: 0.78, width: 1.7, opacity: 0.2, color: "#7bd0ff" },
  { x: 0.75, top: 0.11, end: 0.85, width: 1.5, opacity: 0.22, color: "#83e8ff" },
  { x: 0.79, top: 0.15, end: 0.72, width: 1.1, opacity: 0.16, color: "#ff86ef" },
  { x: 0.82, top: 0.12, end: 0.84, width: 1.9, opacity: 0.22, color: "#70dcff" },
  { x: 0.86, top: 0.16, end: 0.8, width: 1.4, opacity: 0.18, color: "#9174ff" },
  { x: 0.9, top: 0.11, end: 0.82, width: 1.6, opacity: 0.22, color: "#8feaff" },
  { x: 0.93, top: 0.14, end: 0.76, width: 1.2, opacity: 0.18, color: "#7cceff" },
];

export const POOLS: PoolSpec[] = [
  { x: 0.06, y: 0.77, width: 0.29, height: 0.07 },
  { x: 0.37, y: 0.78, width: 0.27, height: 0.065 },
  { x: 0.62, y: 0.79, width: 0.3, height: 0.06 },
  { x: 0.14, y: 0.86, width: 0.24, height: 0.055 },
  { x: 0.41, y: 0.87, width: 0.28, height: 0.055 },
];

export const BLOSSOMS: BlossomSpec[] = [
  { x: 0.17, y: 0.55, size: 11, opacity: 0.68 },
  { x: 0.24, y: 0.58, size: 10, opacity: 0.72 },
  { x: 0.32, y: 0.57, size: 7, opacity: 0.6 },
  { x: 0.39, y: 0.61, size: 8, opacity: 0.58 },
  { x: 0.45, y: 0.59, size: 9, opacity: 0.66 },
  { x: 0.5, y: 0.54, size: 8, opacity: 0.74 },
  { x: 0.58, y: 0.6, size: 8, opacity: 0.58 },
  { x: 0.64, y: 0.56, size: 9, opacity: 0.64 },
  { x: 0.72, y: 0.6, size: 8, opacity: 0.62 },
  { x: 0.81, y: 0.56, size: 10, opacity: 0.7 },
];

export const FLOOR_SHOOTS = [
  { x: 0.08, y: 0.72, h: 22, color: "#7ed7ff" },
  { x: 0.12, y: 0.76, h: 18, color: "#ff7ee8" },
  { x: 0.17, y: 0.73, h: 26, color: "#9f7cff" },
  { x: 0.22, y: 0.79, h: 18, color: "#89e6ff" },
  { x: 0.28, y: 0.75, h: 20, color: "#ff8aec" },
  { x: 0.34, y: 0.82, h: 16, color: "#76dbff" },
  { x: 0.41, y: 0.77, h: 24, color: "#a37cff" },
  { x: 0.47, y: 0.8, h: 20, color: "#8ce8ff" },
  { x: 0.54, y: 0.75, h: 18, color: "#ff86eb" },
  { x: 0.62, y: 0.81, h: 16, color: "#70d2ff" },
  { x: 0.69, y: 0.76, h: 24, color: "#b48fff" },
  { x: 0.75, y: 0.79, h: 18, color: "#87e4ff" },
  { x: 0.82, y: 0.73, h: 20, color: "#ff79e4" },
  { x: 0.9, y: 0.78, h: 18, color: "#7de0ff" },
];
