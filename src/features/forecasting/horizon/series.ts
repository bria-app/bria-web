import type { ForecastResultDTO } from "@/types/api";
import type { OverviewProduct, PreviewProduct } from "@/types/forecasting";
import { periodLabel } from "../labels";

export interface HorizonPoint {
  /** Period start, ISO date. */
  date: string;
  /** «mar 26». */
  label: string;
  value: number;
  lo?: number;
  hi?: number;
}

/** What the stage draws: real sales up to today and, once calculated, what comes after. */
export interface HorizonSeries {
  past: HorizonPoint[];
  future: HorizonPoint[];
  frequency: "monthly" | "weekly";
}

const PAST_MONTHS = 24;
const PAST_WEEKS = 26;

const monthOf = (iso: string) => `${iso.slice(0, 7)}-01`;

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const [y, m] = iso.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, 1)).toISOString().slice(0, 10);
}

const point = (date: string, frequency: HorizonSeries["frequency"], value: number, lo?: number, hi?: number): HorizonPoint => ({
  date,
  label: periodLabel(date, frequency),
  value,
  lo,
  hi,
});

/** Labels for the months a forecast would cover, before it exists: the empty zone says where it goes. */
export function pendingLabels(lastPast: string | undefined, periods: number): string[] {
  if (!lastPast) return [];
  return Array.from({ length: periods }, (_, i) => periodLabel(addMonths(lastPast, i + 1), "monthly"));
}

/** Periods a horizon in days takes on the monthly axis. */
export const horizonPeriods = (days: number) => Math.max(1, Math.round(days / 30));

/** Real monthly sales of a scope, added up, without the month in progress (it would read as a fall). */
export function seriesFromPreview(products: PreviewProduct[], asOf: string | null | undefined): HorizonSeries {
  const counted = products.some((p) => p.included) ? products.filter((p) => p.included) : products;
  const sum = new Map<string, number>();
  for (const p of counted) for (const s of p.monthly_series) sum.set(s.period, (sum.get(s.period) ?? 0) + s.units);
  const cut = asOf ? monthOf(asOf) : null;
  const past = [...sum.keys()]
    .filter((k) => !cut || k < cut)
    .sort()
    .slice(-PAST_MONTHS)
    .map((k) => point(k, "monthly", sum.get(k) ?? 0));
  return { past, future: [], frequency: "monthly" };
}

/** One real product's monthly sales, for the rehearsal. */
export function productValues(p: PreviewProduct, asOf: string | null | undefined): HorizonPoint[] {
  const cut = asOf ? monthOf(asOf) : null;
  return p.monthly_series
    .filter((s) => !cut || s.period < cut)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-PAST_MONTHS)
    .map((s) => point(s.period, "monthly", s.units));
}

/**
 * The run's own numbers on one axis, so the line adds up to the sentence above it.
 * Only weekly products: their weeks as they are. A mix: weeks are shared out to calendar months
 * by the days they span, because weeks and months cannot be added as they come; what spills past
 * the first or last month forecast stays in it, so no unit is lost.
 *
 * The range adds each product's bounds: never narrower than the real one, wider when products
 * don't all fall or rise together. It reads as a generous margin, not as a measured interval.
 */
export function seriesFromResults(results: ForecastResultDTO[], products: OverviewProduct[]): HorizonSeries {
  const active = products.filter((p) => p.status !== "skipped");
  const frequencyOf = new Map(active.map((p) => [p.product_id, p.frequency]));
  const rows = results.filter((r) => frequencyOf.has(r.product_id));
  const allWeekly = active.length > 0 && active.every((p) => p.frequency === "weekly");

  const sold = new Map<string, number>();
  const expected = new Map<string, { value: number; lo: number; hi: number }>();
  const add = (date: string, value: number, lo: number, hi: number, share = 1) => {
    const now = expected.get(date) ?? { value: 0, lo: 0, hi: 0 };
    now.value += value * share;
    now.lo += lo * share;
    now.hi += hi * share;
    expected.set(date, now);
  };

  if (allWeekly) {
    for (const r of rows) {
      for (const h of r.history) {
        const k = h.period_date.slice(0, 10);
        sold.set(k, (sold.get(k) ?? 0) + (Number(h.observed) || 0));
      }
      for (const p of r.points) {
        const v = Number(p.predicted_demand) || 0;
        add(p.period_date.slice(0, 10), v, Number(p.lower_bound ?? v), Number(p.upper_bound ?? v));
      }
    }
    const future = [...expected.keys()].sort();
    const past = [...sold.keys()].filter((k) => !future[0] || k < future[0]).sort().slice(-PAST_WEEKS);
    return {
      frequency: "weekly",
      past: past.map((k) => point(k, "weekly", sold.get(k) ?? 0)),
      future: future.map((k) => point(k, "weekly", expected.get(k)!.value, expected.get(k)!.lo, expected.get(k)!.hi)),
    };
  }

  // Months the forecast covers: those of the products forecast by month, or else those the weeks touch.
  const months = new Set<string>();
  for (const r of rows) {
    if (frequencyOf.get(r.product_id) === "monthly") for (const p of r.points) months.add(monthOf(p.period_date));
  }
  if (months.size === 0) for (const r of rows) for (const p of r.points) months.add(monthOf(p.period_date));
  const covered = [...months].sort();
  const first = covered[0];
  const last = covered[covered.length - 1];
  const lastPast = first ? addMonths(first, -1) : null;

  for (const r of rows) {
    const weekly = frequencyOf.get(r.product_id) === "weekly";
    for (const h of r.history) {
      const v = Number(h.observed) || 0;
      const date = h.period_date.slice(0, 10);
      if (!weekly) {
        const k = monthOf(date);
        sold.set(k, (sold.get(k) ?? 0) + v);
        continue;
      }
      for (let d = 0; d < 7; d++) {
        let k = monthOf(addDays(date, d));
        if (first && k >= first && lastPast) k = lastPast;
        sold.set(k, (sold.get(k) ?? 0) + v / 7);
      }
    }
    for (const p of r.points) {
      const v = Number(p.predicted_demand) || 0;
      const lo = Number(p.lower_bound ?? v);
      const hi = Number(p.upper_bound ?? v);
      const date = p.period_date.slice(0, 10);
      if (!weekly) {
        add(monthOf(date), v, lo, hi);
        continue;
      }
      for (let d = 0; d < 7; d++) {
        let k = monthOf(addDays(date, d));
        if (first && k < first) k = first;
        if (last && k > last) k = last;
        add(k, v, lo, hi, 1 / 7);
      }
    }
  }

  const past = [...sold.keys()].filter((k) => !first || k < first).sort().slice(-PAST_MONTHS);
  return {
    frequency: "monthly",
    past: past.map((k) => point(k, "monthly", sold.get(k) ?? 0)),
    future: [...expected.keys()].sort().map((k) => point(k, "monthly", expected.get(k)!.value, expected.get(k)!.lo, expected.get(k)!.hi)),
  };
}

/* ── The rehearsal ─────────────────────────────────────────────────────────── */

export const ATTEMPT_NAMES = ["Promedio reciente", "Igual que el año pasado", "Tendencia suavizada"] as const;

export interface RehearsalPass {
  title: string;
  points: HorizonPoint[];
}

const AHEAD = 3;
const ORIGINS = 6;

/** Where a pass stops to test: the last months, one after another. Too little history: no tests. */
export function originsOf(n: number): number[] {
  const firstKnown = 5;
  const out: number[] = [];
  for (let o = Math.max(firstKnown, n - 1 - ORIGINS); o <= n - 2; o++) out.push(o);
  return out;
}

export interface Attempt {
  /** Index in ATTEMPT_NAMES. */
  method: number;
  /** Forecast for origin+1, origin+2, ... */
  values: number[];
  /** Units missed, added up, against what really happened. */
  error: number;
}

/**
 * Three simple forecasts worked out here, with what was known at `origin`, on real sales: what the
 * screen shows is true of these numbers. They are a sample to watch; the engine's own tests run
 * on the server, per product, and those decide.
 */
export function attemptsAt(values: number[], origin: number): Attempt[] {
  const known = values.slice(0, origin + 1);
  const steps = Math.min(AHEAD, values.length - 1 - origin);
  const actual = values.slice(origin + 1, origin + 1 + steps);
  const scored = (method: number, forecast: number[]): Attempt => ({
    method,
    values: forecast,
    error: forecast.reduce((t, v, i) => t + Math.abs(v - actual[i]), 0),
  });
  const out: Attempt[] = [];

  const recent = known.slice(-3);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  out.push(scored(0, Array.from({ length: steps }, () => mean)));

  if (origin + 1 >= 12) out.push(scored(1, Array.from({ length: steps }, (_, i) => values[origin + 1 + i - 12])));

  // Holt's damped trend, with fixed weights: the level and a trend that fades.
  let level = known[0];
  let trend = known.length > 1 ? known[1] - known[0] : 0;
  const [alpha, beta, phi] = [0.45, 0.2, 0.85];
  for (const y of known.slice(1)) {
    const prev = level;
    level = alpha * y + (1 - alpha) * (level + phi * trend);
    trend = beta * (level - prev) + (1 - beta) * phi * trend;
  }
  let run = 0;
  let damp = 1;
  out.push(
    scored(
      2,
      Array.from({ length: steps }, () => {
        damp *= phi;
        run += damp;
        return Math.max(0, level + run * trend);
      }),
    ),
  );
  return out;
}

/* ── Curves ────────────────────────────────────────────────────────────────── */

/** Tangents of a monotone curve (Fritsch–Carlson): it goes through every point and invents no peaks. */
export function tangents(ys: number[]): number[] {
  const n = ys.length;
  if (n < 2) return [0];
  const d = Array.from({ length: n - 1 }, (_, i) => ys[i + 1] - ys[i]);
  const m = new Array<number>(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return m;
}

export function curveAt(ys: number[], m: number[], t: number): number {
  if (ys.length < 2) return ys[0] ?? 0;
  const i = Math.min(ys.length - 2, Math.max(0, Math.floor(t)));
  const u = Math.max(0, Math.min(1, t - i));
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * m[i + 1];
}

/** Round axis steps, in whole units: nobody sells 2.5 of something. */
export function niceScale(max: number): { top: number; ticks: number[] } {
  const safe = Math.max(max, 1);
  const raw = safe / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, ([1, 2, 2.5, 5, 10].find((k) => k * mag >= raw && Number.isInteger(k * mag)) ?? 10) * mag);
  const top = Math.ceil(safe / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
}
