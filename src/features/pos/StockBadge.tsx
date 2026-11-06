import { Badge } from "@/components/ui/Badge";
import { units } from "@/lib/format";

export type StockTone = "out" | "low" | "ok";

export function stockTone(stock: number, reorderPoint = 0): StockTone {
  if (stock <= 0) return "out";
  if (stock <= Math.max(reorderPoint, 5)) return "low";
  return "ok";
}

export const STOCK_LABEL: Record<StockTone, string> = { out: "Agotado", low: "Quedan pocos", ok: "Disponible" };
const TONE = { out: "danger", low: "warning", ok: "success" } as const;

/** «12 u · Quedan pocos», colored by status but always with text. */
export function StockBadge({ stock, reorderPoint = 0 }: { stock: number; reorderPoint?: number }) {
  const tone = stockTone(stock, reorderPoint);
  return (
    <Badge tone={TONE[tone]}>
      {tone === "out" ? STOCK_LABEL.out : <><span className="font-mono">{units(stock)}</span> · {STOCK_LABEL[tone]}</>}
    </Badge>
  );
}
