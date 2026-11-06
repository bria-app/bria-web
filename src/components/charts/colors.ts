/**
 * Theme colors for chart libraries, as CSS variable references. SVG attributes and inline styles
 * resolve `var()` themselves, so switching light/dark recolors every chart without a re-render.
 */
const token = (name: string) => `rgb(var(${name}))`;

export const CHART_COLORS = {
  /** Amber: the main series and forecast ranges. */
  primary: token("--c-primary"),
  /** Amber legible on surfaces: forecast lines. */
  accentText: token("--c-accent-text"),
  muted: token("--c-text-muted"),
  success: token("--c-success"),
  warning: token("--c-warning"),
  danger: token("--c-danger"),
  text: token("--c-text"),
  /** Chart gridlines. */
  grid: token("--c-border-soft"),
  surface: token("--c-surface"),
} as const;
