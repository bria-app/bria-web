import { formatNumber } from "@/lib/format";
import type { ProductTimeline } from "@/types/inventory";

/**
 * Plain-language reading of a product's real history: trend, the same months a year before,
 * its usual best and worst months, the strongest weekday and the days it ran out. Pure: it only
 * reads the timeline, and says nothing when the history is too short to support a claim.
 */

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];

/** «ago 26» from «2026-08». */
export const monthShort = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1].slice(0, 3)} ${ym.slice(2, 4)}`;

export type InsightTone = "up" | "down" | "flat" | "alert" | "calm" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  text: string;
}

/** A change below this share reads as «se mantiene». */
const STEADY = 0.1;

const total = (xs: { units: number }[]) => xs.reduce((n, x) => n + x.units, 0);
const signed = (ratio: number) => `${ratio > 0 ? "+" : "−"}${formatNumber(Math.abs(ratio) * 100)} %`;
/** «+12 % frente a» or «igual que» when the change rounds to nothing. */
const against = (ratio: number) => (Math.round(ratio * 100) === 0 ? "Igual que" : `${signed(ratio)} frente a`);
const listOf = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
const toneOf = (ratio: number): InsightTone => (ratio > STEADY ? "up" : ratio < -STEADY ? "down" : "flat");
const span = (months: { month: string }[]) => `${monthShort(months[0].month)} – ${monthShort(months[months.length - 1].month)}`;

export function salesInsights(t: Pick<ProductTimeline, "monthly_sales" | "weekly_sales" | "weekday_units">, unit: string): Insight[] {
  const out: Insight[] = [];
  // The current month is still running: only whole months are compared.
  const months = t.monthly_sales.slice(0, -1);
  const first = months.findIndex((m) => m.units > 0);
  const n = months.length;

  if (first >= 0 && n - first >= 6) {
    const last = months.slice(n - 3);
    const before = months.slice(n - 6, n - 3);
    const a = total(last);
    const b = total(before);
    if (b > 0) {
      const r = (a - b) / b;
      out.push({
        id: "trend",
        tone: toneOf(r),
        title: r > STEADY ? "Viene subiendo" : r < -STEADY ? "Viene bajando" : "Se mantiene",
        text: `En ${span(last)} vendiste ${formatNumber(a)} ${unit}: ${against(r).toLowerCase()} los tres meses anteriores (${formatNumber(b)} ${unit}).`,
      });
    }
  }

  if (first >= 0 && n - 15 >= first) {
    const last = months.slice(n - 3);
    const yearBefore = months.slice(n - 15, n - 12);
    const a = total(last);
    const b = total(yearBefore);
    if (b > 0) {
      const r = (a - b) / b;
      out.push({
        id: "yoy",
        tone: toneOf(r),
        title: "Contra el año pasado",
        text: `${against(r)} ${span(yearBefore)}, cuando vendiste ${formatNumber(b)} ${unit} en los mismos meses.`,
      });
    }
  }

  const history = first >= 0 ? months.slice(first) : [];
  if (history.length >= 12) {
    const byMonth = new Map<number, number[]>();
    const short = new Set<number>(); // calendar months that ran out of stock at least once
    for (const m of history) {
      const k = Number(m.month.slice(5, 7)) - 1;
      byMonth.set(k, [...(byMonth.get(k) ?? []), m.units]);
      if (m.lost_units > 0) short.add(k);
    }
    const avg = [...byMonth].map(([k, xs]) => ({ k, v: xs.reduce((s, x) => s + x, 0) / xs.length }));
    const mean = avg.reduce((s, x) => s + x.v, 0) / avg.length;
    const best = avg.reduce((p, x) => (x.v > p.v ? x : p));
    const worst = avg.reduce((p, x) => (x.v < p.v ? x : p));
    if (mean > 0) {
      const up = best.v / mean - 1;
      const down = worst.v / mean - 1;
      // Months far below normal, in calendar order from the one after the best month.
      const quiet = avg
        .filter((x) => x.v < mean * 0.25)
        .map((x) => x.k)
        .sort((a, b) => ((a - best.k + 12) % 12) - ((b - best.k + 12) % 12));
      const peak = `Su mejor mes suele ser ${MONTHS[best.k]} (${signed(up)} sobre un mes normal)${short.has(best.k) ? " y aun así te faltó stock" : ""}.`;
      out.push(
        up < 0.15 && down > -0.15
          ? { id: "season", tone: "info", title: "Parejo todo el año", text: "Ningún mes se aleja mucho de un mes normal: no tiene temporada marcada." }
          : {
              id: "season",
              tone: "info",
              title: "Su temporada",
              text:
                quiet.length >= 2
                  ? `${peak} Casi no se vende en ${listOf(quiet.map((k) => MONTHS[k]))}.`
                  : `${peak} El más flojo es ${MONTHS[worst.k]} (${signed(down)}).`,
            },
      );
    }
  }

  const week = t.weekday_units;
  const weekTotal = week.reduce((s, x) => s + x, 0);
  if (weekTotal >= 14) {
    const best = week.indexOf(Math.max(...week));
    const worst = week.indexOf(Math.min(...week));
    const share = week[best] / weekTotal;
    if (share > 1.25 / 7) {
      out.push({
        id: "weekday",
        tone: "info",
        title: "Su día fuerte",
        text: `Se vende más los ${WEEKDAYS[best]}: ${formatNumber(share * 100)} % de lo de la semana. Los ${WEEKDAYS[worst]}, lo que menos.`,
      });
    }
  }

  const weeks = t.weekly_sales;
  if (weeks.length) {
    const outWeeks = weeks.filter((w) => w.stockout_days > 0).length;
    const days = weeks.reduce((s, w) => s + w.stockout_days, 0);
    const lost = weeks.reduce((s, w) => s + w.lost_units, 0);
    const asked = lost > 0 ? ` Te pidieron ${formatNumber(lost)} ${unit} que no tenías.` : "";
    if (days > 0) {
      out.push({
        id: "stockout",
        tone: "alert",
        title: "Te quedaste sin stock",
        text: `${formatNumber(days)} ${days === 1 ? "día" : "días"} en ${outWeeks} ${outWeeks === 1 ? "semana" : "semanas"} de las últimas ${weeks.length}.${asked} Esas ventas no se ven en el gráfico.`,
      });
    } else if (lost > 0) {
      out.push({ id: "stockout", tone: "alert", title: "Te faltó al vender", text: `En las últimas ${weeks.length} semanas.${asked}` });
    } else if (total(weeks) > 0) {
      out.push({ id: "stockout", tone: "calm", title: "Siempre hubo stock", text: `No te quedaste sin este producto en las últimas ${weeks.length} semanas.` });
    }
  }

  return out;
}
