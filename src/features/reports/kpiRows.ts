import type { KpiDTO, KpiType } from "@/types/api";

/** The API stores 9999 days when nothing is expected to sell («effectively infinite»). */
const NO_DEMAND_DAYS = 9999;

export interface KpiRow {
  productId: string;
  coverage: number | null;
  stockoutRisk: number | null;
  overstockRisk: number | null;
  turnover: number | null;
  computedAt: string;
}

export type StockState = "se_acaba" | "de_sobra" | "en_orden";

/** Latest value per (product, KPI), one row per product, riskiest first. */
export function pivotKpis(kpis: KpiDTO[]): KpiRow[] {
  const latest = new Map<string, KpiDTO>();
  for (const k of kpis) {
    const key = `${k.product_id}:${k.kpi_type}`;
    const prev = latest.get(key);
    if (!prev || k.computed_at > prev.computed_at) latest.set(key, k);
  }
  const rows = new Map<string, KpiRow>();
  const field: Record<KpiType, keyof Pick<KpiRow, "coverage" | "stockoutRisk" | "overstockRisk" | "turnover">> = {
    coverage_days: "coverage",
    stockout_risk: "stockoutRisk",
    overstock_risk: "overstockRisk",
    turnover: "turnover",
  };
  for (const k of latest.values()) {
    const row = rows.get(k.product_id) ?? {
      productId: k.product_id,
      coverage: null,
      stockoutRisk: null,
      overstockRisk: null,
      turnover: null,
      computedAt: k.computed_at,
    };
    row[field[k.kpi_type]] = Number(k.value);
    if (k.computed_at > row.computedAt) row.computedAt = k.computed_at;
    rows.set(k.product_id, row);
  }
  return [...rows.values()].sort((a, b) => (b.stockoutRisk ?? 0) - (a.stockoutRisk ?? 0));
}

/**
 * Same rules as the API: any shortfall over (supplier wait + two weeks) means it runs out;
 * any stock beyond ~4 months of sales means there is too much.
 */
export function stockState(r: KpiRow): StockState {
  if ((r.stockoutRisk ?? 0) > 0 || r.coverage === 0) return "se_acaba";
  if ((r.overstockRisk ?? 0) > 0) return "de_sobra";
  return "en_orden";
}

export const hasDemand = (r: KpiRow) => r.coverage != null && r.coverage < NO_DEMAND_DAYS;

export function averageCoverage(rows: KpiRow[]): number | null {
  const days = rows.filter(hasDemand).map((r) => r.coverage as number);
  return days.length ? days.reduce((a, b) => a + b, 0) / days.length : null;
}
