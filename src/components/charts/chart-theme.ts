import type { CSSProperties } from "react";

/** Recharts defaults to white tooltip + black text; align with popover / dark mode. */
export const chartTooltipContentStyle: CSSProperties = {
  margin: 0,
  padding: "8px 12px",
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  color: "var(--popover-foreground)",
  whiteSpace: "nowrap",
  boxShadow: "0 4px 16px oklch(0 0 0 / 0.14)",
};

export const chartTooltipLabelStyle: CSSProperties = {
  color: "var(--popover-foreground)",
  marginBottom: 4,
  fontWeight: 600,
};

export const chartTooltipItemStyle: CSSProperties = {
  display: "block",
  paddingTop: 4,
  paddingBottom: 4,
  color: "var(--popover-foreground)",
};

export const chartTooltipWrapperStyle: CSSProperties = {
  outline: "none",
  backgroundColor: "transparent",
};

/** Subtle bar hover: follows theme (muted is light on light UI, darker gray on dark UI). */
export const chartBarCursor = { fill: "var(--muted)" };

/** Line chart crosshair: low-contrast, theme-aware. */
export const chartLineTooltipCursor = {
  stroke: "var(--muted-foreground)",
  strokeWidth: 1,
  strokeOpacity: 0.35,
  strokeDasharray: "4 4",
};
