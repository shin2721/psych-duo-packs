export const theme = {
  colors: {
    bg: "#040812",
    surface: "rgba(22, 34, 58, 0.48)",
    card: "rgba(26, 40, 68, 0.56)",
    line: "rgba(120, 140, 180, 0.14)",
    cardBorder: "rgba(255, 255, 255, 0.07)",
    cardEdgeHighlight: "rgba(255, 255, 255, 0.10)",
    text: "#e5e7eb",
    sub: "#b0b8c4",
    accent: "#22d3ee",
    success: "#22c55e",
    warn: "#f59e0b",
    error: "#ef4444",
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    // Canonical 4-step scale. Use these for new work; h1/h2/h3/label kept for
    // backwards compatibility.
    display: {
      fontSize: 32,
      fontWeight: "800" as const,
      lineHeight: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      lineHeight: 28,
    },
    h1: {
      fontSize: 28,
      fontWeight: "800" as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: "700" as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: "700" as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 17,
      fontWeight: "500" as const,
      lineHeight: 26,
    },
    label: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 16,
    },
    buttonSm: {
      fontSize: 13,
      fontWeight: "800" as const,
      lineHeight: 18,
    },
    buttonMd: {
      fontSize: 16,
      fontWeight: "800" as const,
      lineHeight: 22,
    },
    buttonLg: {
      fontSize: 18,
      fontWeight: "700" as const,
      lineHeight: 24,
    },
  },
};
