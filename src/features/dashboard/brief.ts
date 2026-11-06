import { formatNumber, soles } from "@/lib/format";
import type { ErpSummary } from "@/types/forecasting";
import type { TodayCash } from "./todayCash";

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** One short line from real numbers: «Llevas S/ 280.00 en 4 ventas · 1 producto agotado». */
export function buildBrief(cash: TodayCash | null, s: ErpSummary | null): string | undefined {
  const parts: string[] = [];
  if (cash) parts.push(cash.tickets > 0 ? `Llevas ${soles(cash.total)} en ${plural(cash.tickets, "venta", "ventas")}` : "Aún no vendes hoy");
  if (s && s.active_products > 0) {
    const out = s.out_of_stock_count;
    const low = Math.max(0, s.low_stock_count - out);
    if (out > 0) parts.push(plural(out, "producto agotado", "productos agotados"));
    if (low > 0) parts.push(`${formatNumber(low)} por acabarse`);
    if (out === 0 && low === 0) parts.push("nada por acabarse");
  }
  return parts.length ? parts.join(" · ") : undefined;
}

/** «Rosa» from «Rosa Quispe». */
export const firstName = (fullName: string | null | undefined) => fullName?.trim().split(/\s+/)[0] ?? "";
