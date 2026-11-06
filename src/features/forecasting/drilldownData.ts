import type { ForecastResultDTO } from "@/types/api";

/**
 * Rows for `ForecastDrilldownChart`, built apart from the component. The forecast side is a direct mapping of what the engine returned:
 *
 *   forecast = predicted_demand,  band = [lower_bound, upper_bound]
 *
 * Nothing is reshaped, re-centred, ramped or smoothed. When a point has no bounds its band
 * is null (no band is invented). The only extra key is `bridge`: a thin connector from the
 * last observed sale to the first predicted value, so the eye can follow the story; it is
 * not part of the tooltip and never changes a forecast value.
 */
interface DrilldownRow {
  name: string;
  observed?: number;
  cleaned?: number | null;
  fitted?: number | null;
  stockout?: number | null;
  outlier?: number | null;
  forecast?: number | null;
  band?: [number, number] | null;
  bridge?: number | null;
}

interface DrilldownData {
  rows: DrilldownRow[];
  /** Engine forecast values, in order (same as `result.points[*].predicted_demand`). */
  predicted: number[];
  /** True when the engine returned (practically) the same value for every period. */
  flat: boolean;
  /** How many forecast points came with both bounds. */
  boundedPoints: number;
}

const toNum = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** A forecast is "flat" when its whole range is below 0.5 % of its level (or 0.01 units). */
function isFlat(values: number[]): boolean {
  if (values.length < 2) return false;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return max - min <= Math.max(0.01, Math.abs(mean) * 0.005);
}

export function buildDrilldownData(
  result: Pick<ForecastResultDTO, "history" | "points">,
  frequency: string,
  range: "recent" | "all",
): DrilldownData {
  const window = frequency === "weekly" ? 52 : 36;
  const hist = range === "all" ? result.history : result.history.slice(-window);

  const rows: DrilldownRow[] = hist.map((h) => {
    const observed = Number(h.observed);
    const cleaned = toNum(h.cleaned);
    return {
      name: h.period_date,
      observed,
      cleaned: cleaned != null && cleaned !== observed ? cleaned : null,
      fitted: toNum(h.fitted),
      stockout: h.is_stockout ? observed : null,
      outlier: (h as { is_outlier?: boolean }).is_outlier ? observed : null,
    };
  });

  const predicted: number[] = [];
  let boundedPoints = 0;
  const last = rows[rows.length - 1];

  result.points.forEach((p, k) => {
    const value = Number(p.predicted_demand);
    const lo = toNum(p.lower_bound);
    const hi = toNum(p.upper_bound);
    const band: [number, number] | null = lo != null && hi != null ? [lo, hi] : null;
    if (band) boundedPoints += 1;
    predicted.push(value);
    rows.push({ name: p.period_date, forecast: value, band, bridge: k === 0 && last ? value : null });
  });

  if (last && result.points.length) last.bridge = last.observed ?? null;

  return { rows, predicted, flat: isFlat(predicted), boundedPoints };
}
