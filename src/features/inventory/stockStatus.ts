import type { BadgeTone } from "@/components/ui/Badge";
import type { StockStatus } from "@/types/inventory";

export const STATUS_TONE: Record<StockStatus, BadgeTone> = {
  sin_stock: "danger",
  critico: "danger",
  reordenar: "warning",
  ok: "success",
};

/** Same defaults the backend uses when a product has no lead time (recommendations/domain/services.py). */
const DEFAULT_LEAD_TIME_DAYS = 7;
const SAFETY_MARGIN_DAYS = 14;

/**
 * Stock status for one product, mirroring `inventory/overview`: the basic thresholds, plus
 * «reordenar» when the stock will not last the supplier's wait plus two weeks (and the
 * minimum). `coverageDays` is the backend's own figure, so the pace is the same one.
 */
export function productStatus(
  onHand: number,
  safetyStock: number,
  reorderPoint: number,
  coverageDays: number | null,
  leadTimeDays: number,
): StockStatus {
  if (onHand <= 0) return "sin_stock";
  if (onHand <= safetyStock) return "critico";
  if (onHand <= reorderPoint) return "reordenar";
  if (coverageDays != null && coverageDays > 0) {
    const daily = onHand / coverageDays;
    const window = (leadTimeDays > 0 ? leadTimeDays : DEFAULT_LEAD_TIME_DAYS) + SAFETY_MARGIN_DAYS;
    if (onHand < daily * window + safetyStock) return "reordenar";
  }
  return "ok";
}

/** «12 días», «+1 año» or null when there are no recent sales to judge by. */
export function coverageText(days: number | null): string | null {
  if (days == null) return null;
  if (days >= 365) return "+1 año";
  const n = Math.round(days);
  return n === 1 ? "1 día" : `${n} días`;
}

const PLAIN_UNITS = new Set(["unit", "unidad", "unidades", "und", "un", "u"]);

/** Unit label next to a quantity: «u» for plain units, the measure otherwise. */
export function unitLabel(uom: string): string {
  return PLAIN_UNITS.has(uom.trim().toLowerCase()) ? "u" : uom;
}

/** Margin over the price, in %. Null without a price or when the cost is hidden (sellers get null). */
export function marginPct(price: number, cost: number | null | undefined): number | null {
  return price > 0 && cost != null && Number.isFinite(cost) ? ((price - cost) / price) * 100 : null;
}

/** An API amount as a number, or null when the API hides or lacks it. */
export function maybeNumber(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
