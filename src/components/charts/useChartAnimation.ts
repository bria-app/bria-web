"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Props for every recharts series: they draw in, or simply appear with reduced motion. */
export function useChartAnimation() {
  return { isAnimationActive: !useReducedMotion(), animationDuration: 900 };
}
