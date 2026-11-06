/**
 * «¿Qué tan bien acierta?»: score a backtest run (forecast made at a past cut-off) against what
 * really sold afterwards (the run's tracking). Accuracy = 100 − WAPE: units missed over units
 * sold, summed over products, for a few horizons after the cut-off (`MILESTONES`).
 */
import { formatNumber } from "@/lib/format";
import { limaDate } from "@/lib/lima";
import type { ProductTracking, RunTracking } from "@/types/forecasting";

/** How far back the test can go: the forecast is compared month by month for this long. */
export const TEST_LENGTHS = [3, 6, 12] as const;
export type TestLength = (typeof TEST_LENGTHS)[number];
/** The rings: a few horizons inside the test (always ending with the whole test). */
export const MILESTONES: Record<TestLength, number[]> = { 3: [1, 2, 3], 6: [1, 3, 6], 12: [1, 6, 12] };

/** Today in Lima as YYYY-MM-DD (the API's calendar). */
export function limaToday(now = Date.now()): string {
  return limaDate(new Date(now));
}

/** The cut-off: the 1st of the month `months` months back, so every tested month is complete. */
export function testCutoff(months: number, today = limaToday()): string {
  const [y, m] = today.split("-").map(Number);
  const idx = y * 12 + (m - 1) - months;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}-01`;
}

const monthIndex = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** «1 de agosto», or «1 de noviembre de 2025» when it is not this year. */
export const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const thisYear = Number(limaToday().slice(0, 4));
  return `${d} de ${MONTHS[m - 1]}${y !== thisYear ? ` de ${y}` : ""}`;
};
export const monthName = (iso: string, offset = 0) => MONTHS[(monthIndex(iso) + offset) % 12];
export const shortMonth = (iso: string, offset = 0) => monthName(iso, offset).slice(0, 3);

export interface HorizonScore {
  months: number;
  forecast: number;
  actual: number;
  /** 0..100, null when nothing sold in the window. */
  accuracy: number | null;
}

export interface ProductScore {
  id: string;
  sku: string;
  name: string;
  forecast: number;
  actual: number;
  accuracy: number | null;
  /** (forecast − actual) / actual, %. */
  bias: number | null;
}

export interface AccuracyReport {
  asOf: string;
  length: TestLength;
  horizons: HorizonScore[];
  /** Units per month after the cut-off, every product together. */
  months: { label: string; forecast: number; actual: number }[];
  products: ProductScore[];
  bias: number | null;
}

const acc = (f: number, a: number) => (a > 0 ? Math.max(0, 100 - (Math.abs(f - a) / a) * 100) : null);

/** Per product, units forecast and sold in each month after the cut-off (complete periods only). */
function byMonth(p: ProductTracking, asOf: string, months: number): { f: number[]; a: number[] } {
  const f = Array(months).fill(0);
  const a = Array(months).fill(0);
  const base = monthIndex(asOf);
  for (const r of p.rows) {
    if (r.actual == null || r.partial) continue;
    // A weekly period that starts a few days before the cut-off counts in its first month.
    const k = Math.max(0, monthIndex(r.period) - base);
    if (k >= months) continue;
    f[k] += r.forecast;
    a[k] += r.actual;
  }
  return { f, a };
}

export function scoreBacktest(tracking: RunTracking, asOf: string, length: TestLength): AccuracyReport {
  const per = tracking.products.map((p) => ({ p, ...byMonth(p, asOf, length) })).filter((x) => x.a.some((v) => v > 0) || x.f.some((v) => v > 0));
  const horizons: HorizonScore[] = [];
  for (const m of MILESTONES[length]) {
    let missed = 0;
    let forecast = 0;
    let actual = 0;
    for (const x of per) {
      const fm = x.f.slice(0, m).reduce((t, v) => t + v, 0);
      const am = x.a.slice(0, m).reduce((t, v) => t + v, 0);
      missed += Math.abs(fm - am);
      forecast += fm;
      actual += am;
    }
    horizons.push({ months: m, forecast, actual, accuracy: actual > 0 ? Math.max(0, 100 - (missed / actual) * 100) : null });
  }
  const months = Array.from({ length }, (_, k) => ({
    label: shortMonth(asOf, k),
    forecast: per.reduce((t, x) => t + x.f[k], 0),
    actual: per.reduce((t, x) => t + x.a[k], 0),
  }));
  const products = per
    .map(({ p, f, a }) => {
      const fs = f.reduce((t, v) => t + v, 0);
      const as = a.reduce((t, v) => t + v, 0);
      return { id: p.product_id, sku: p.sku, name: p.name, forecast: fs, actual: as, accuracy: acc(fs, as), bias: as > 0 ? ((fs - as) / as) * 100 : null };
    })
    .sort((x, y) => (y.accuracy ?? -1) - (x.accuracy ?? -1));
  const last = horizons[horizons.length - 1];
  return { asOf, length, horizons, months, products, bias: last.actual > 0 ? ((last.forecast - last.actual) / last.actual) * 100 : null };
}

export type Tone = "good" | "near" | "far";
export const toneOf = (accuracy: number | null): Tone => (accuracy == null ? "far" : accuracy >= 85 ? "good" : accuracy >= 70 ? "near" : "far");
export const toneLabel: Record<Tone, string> = { good: "Clavado", near: "Cerca", far: "Se alejó" };

const round = (v: number) => formatNumber(Math.round(v));
const pct = (v: number) => `${Math.round(Math.abs(v))} %`;
const list = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`);
/** «Arena», «Comida Húmeda»: the product's first words, without a dangling «para», «de»… */
const short = (name: string) => {
  const w = name.split(" ");
  return ["para", "de", "del", "con", "x"].includes((w[1] ?? "").toLowerCase()) ? w[0] : w.slice(0, 2).join(" ");
};

/** What the owner should take away, in plain words, from what the numbers show. */
export function observations(r: AccuracyReport): { tone: Tone | "info"; text: string }[] {
  const out: { tone: Tone | "info"; text: string }[] = [];
  const h1 = r.horizons[0];
  const h3 = r.horizons[r.horizons.length - 1];
  const span = `${h3.months} meses`;
  if (h1.accuracy != null && h3.accuracy != null) {
    out.push({
      tone: toneOf(h3.accuracy),
      text:
        Math.abs(h1.accuracy - h3.accuracy) < 2
          ? `Acertó parejo: ${pct(h1.accuracy)} a un mes y ${pct(h3.accuracy)} a ${span}.`
          : h3.accuracy > h1.accuracy
            ? `En el total de ${span} acertó más (${pct(h3.accuracy)}) que en un solo mes (${pct(h1.accuracy)}): lo que erró un mes se compensa con el siguiente. Para un pedido grande, guíate por el total.`
            : `A un mes acertó ${pct(h1.accuracy)}; a ${span}, ${pct(h3.accuracy)}. Entre más lejos, menos exacto: vuelve a calcular cada mes.`,
    });
  }
  if (r.bias != null) {
    out.push({
      tone: "info",
      text:
        Math.abs(r.bias) < 5
          ? `No se inclinó para ningún lado: en total pronosticó casi lo mismo que vendiste (${r.bias >= 0 ? "+" : "−"}${pct(r.bias)}).`
          : r.bias > 0
            ? `En total pronosticó ${pct(r.bias)} de más: te habría hecho comprar ${Math.abs(r.bias) < 15 ? "un poco" : "bastante"} de sobra.`
            : `En total pronosticó ${pct(r.bias)} de menos: te habrías quedado corto en algunos productos.`,
    });
  }
  const clavados = r.products.filter((p) => (p.accuracy ?? 0) >= 92 && p.actual >= 20).slice(0, 3);
  if (clavados.length) out.push({ tone: "good", text: `Clavó ${list(clavados.map((p) => short(p.name)))}: los que se venden seguido.` });
  for (const p of r.products) {
    if (p.bias == null || p.actual < 12) continue;
    if (p.bias > 35)
      out.push({
        tone: "far",
        text: `En ${short(p.name)} esperaba ${round(p.forecast)} u y vendiste ${round(p.actual)} (${pct(p.bias)} de más). Si algo cambió (competencia, precio, una temporada que no se repitió o un crecimiento que se frenó), el pronóstico tarda en notarlo: mientras más lejos, más pesa.`,
      });
    else if (p.bias < -35)
      out.push({ tone: "near", text: `${short(p.name)} vendió más de lo esperado: ${round(p.actual)} u contra ${round(p.forecast)}. Si fue una promoción o un pedido grande, no se repetirá solo.` });
  }
  const few = r.products.filter((p) => p.actual > 0 && p.actual < 15 && (p.accuracy ?? 0) < 75);
  if (few.length)
    out.push({ tone: "info", text: `${list(few.map((p) => short(p.name)))} ${few.length === 1 ? "vende" : "venden"} pocas unidades: 2 o 3 de diferencia mueven mucho el porcentaje. Mira las unidades, no el %.` });
  out.push({ tone: "info", text: "Lo vendido no cuenta lo que no pudiste vender por falta de stock: si te quedaste sin mercadería, el acierto real puede ser mejor." });
  return out;
}
