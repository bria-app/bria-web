/** Costing and date helpers shared by the Compras and Proveedores screens. */
import { shortDate } from "@/lib/format";
import { limaDate } from "@/lib/lima";
import { IGV_RATE, round2 } from "@/lib/money";

export const num = (v: number | string | null | undefined): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Today's date in Lima as yyyy-mm-dd (the shop's calendar, whatever the device's timezone). */
export const todayISO = (): string => limaDate(new Date());

/** What is wrong with a purchase date, in plain words, or null when it is fine. */
export function purchaseDateError(iso: string): string | null {
  if (!iso) return "Elige la fecha de la compra.";
  if (iso > todayISO()) return "La fecha no puede ser después de hoy.";
  return null;
}

/** «2 nov 2026» for a backend date-only value (read as that calendar day, see `toDate`). */
export function dayLabel(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "—";
  return shortDate(iso.slice(0, 10));
}

/** Same rule as the backend (inventory.domain.costing): negative stock carries no value. */
export function weightedAverage(onHand: number, currentAvg: number, quantity: number, unitCost: number): number {
  const stock = Math.max(onHand, 0);
  const total = stock + quantity;
  if (total <= 0) return round2(unitCost);
  return round2((stock * currentAvg + quantity * unitCost) / total);
}

/**
 * An amount in whole céntimos, half up like the backend's `money`. `toPrecision` drops the binary
 * noise first, so 1.005 gives 101 (as Decimal does) and not 100.
 */
export const centsOf = (v: number): number => Math.round(Number((v * 100).toPrecision(12)));

/** IGV-inclusive total for a net subtotal, rounded like the backend (costs are stored net: crédito fiscal). */
export function withIgv(netSubtotal: number): { igv: number; total: number } {
  // In céntimos so a half céntimo (e.g. 0.25 × 18 %) rounds up as in Decimal ROUND_HALF_UP.
  const net = centsOf(netSubtotal);
  const igv = Math.round((net * Math.round(IGV_RATE * 100)) / 100);
  return { igv: igv / 100, total: (net + igv) / 100 };
}
