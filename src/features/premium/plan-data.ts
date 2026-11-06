import { format } from "date-fns";
import { es } from "date-fns/locale";
import { limaDate } from "@/lib/lima";
import { IGV_RATE, round2 } from "@/lib/money";
import type { FtgmQuota } from "@/types/forecasting";
import type { BillingCycle, PlanDTO } from "@/types/billing";

export const CYCLE_LABEL: Record<BillingCycle, string> = { monthly: "Mensual", yearly: "Anual" };

export const METHOD_LABEL: Record<string, string> = {
  card: "Tarjeta",
  yape: "Yape",
  transferencia: "Transferencia",
};

export function priceFor(plan: PlanDTO, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
}

export function parseCycle(v: string | null | undefined): BillingCycle {
  return v === "yearly" ? "yearly" : "monthly";
}

/** Prices already include 18 % IGV: split them the way a Peruvian receipt does. */
export function igvBreakdown(total: number) {
  const base = round2(total / (1 + IGV_RATE));
  return { base, igv: round2(total - base) };
}

/** Same rule as the backend: one month or one year later, clamped to the month's last day. */
export function addCycle(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + (cycle === "yearly" ? 12 : 1));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

/**
 * The free plan's monthly prediction limit: the live quota when we have it, otherwise the
 * number written in the plan catalog («Límite de 3 predicciones…»).
 */
export function freeMonthlyLimit(free: PlanDTO | undefined, quota: FtgmQuota | null): number | null {
  if (quota?.monthly_limit != null) return quota.monthly_limit;
  const match = free?.limits.join(" ").match(/\d+/);
  return match ? Number(match[0]) : null;
}

/** Features of the free plan other than the prediction line, which the comparison shows on its own. */
export function sharedFeatures(free: PlanDTO): string[] {
  return free.features.filter((f) => !/predicci|\bIA\b/i.test(f));
}

/** The Lima calendar month of an instant, as a local date on its first day (the quota counts Lima months). */
function limaMonthStart(at: Date): Date {
  const [y, m] = limaDate(at).split("-").map(Number);
  return new Date(y, m - 1, 1);
}

const monthName = (firstDay: Date) => format(firstDay, "MMMM", { locale: es });
/** «noviembre» for the Lima month the instant falls in. */
const month = (at: Date) => monthName(limaMonthStart(at));

/** First day of next month, when the free quota starts over (Lima calendar month). */
function nextReset(now = new Date()): Date {
  const start = limaMonthStart(now);
  return new Date(start.getFullYear(), start.getMonth() + 1, 1);
}

/**
 * One sentence about this month's predictions, with the company's own numbers.
 * Used on the plans page and in Configuración › Plan.
 */
export function quotaSentence(quota: FtgmQuota, now = new Date()): string {
  const reset = `el 1 de ${monthName(nextReset(now))}`;
  if (quota.monthly_limit === null) {
    return quota.used === 1
      ? "Este mes lanzaste 1 predicción. Con Premium no tienes tope."
      : `Este mes lanzaste ${quota.used} predicciones. Con Premium no tienes tope.`;
  }
  const limit = quota.monthly_limit;
  const remaining = quota.remaining ?? Math.max(0, limit - quota.used);
  if (quota.used === 0) return `Aún no lanzas predicciones en ${month(now)}. Tienes ${limit} gratis hasta fin de mes.`;
  if (remaining === 0) {
    return `Ya usaste tus ${limit} predicciones de ${month(now)}. La próxima se habilita ${reset}; con Premium la lanzas hoy.`;
  }
  return `Este mes usaste ${quota.used} de tus ${limit} predicciones. ${remaining === 1 ? "Te queda 1" : `Te quedan ${remaining}`} hasta ${reset}.`;
}
