"use client";

import { formatNumber } from "@/lib/format";
import { CountUp } from "./CountUp";

/** «S/ 1,234.50», «12 prod.», «40.3 %», «≈ 12»: one number with text only around it. */
const FIGURE = /^([^\d-]*)(-?\d[\d,]*(?:\.(\d+))?)([^\d]*)$/;

/**
 * Counts up the number inside an already formatted figure, keeping its prefix, suffix and
 * decimals. Anything that is not a single figure (dates, «—», ranges) is shown as is.
 */
export function AnimatedFigure({ text }: { text: string }) {
  const m = FIGURE.exec(text);
  if (!m) return <>{text}</>;
  const [, prefix, number, decimals = "", suffix] = m;
  const value = Number(number.replace(/,/g, ""));
  if (!Number.isFinite(value)) return <>{text}</>;
  return <CountUp value={value} format={(n) => `${prefix}${formatNumber(n, decimals.length)}${suffix}`} />;
}
