import { soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Numeric } from "@/types/api";

interface TotalsListProps {
  /** Before discounts. Omit when it equals the total. */
  gross?: Numeric;
  discount: Numeric;
  subtotal: Numeric;
  igv: Numeric;
  total: Numeric;
  className?: string;
}

/** Comprobante breakdown: prices include IGV, so Op. gravada = Total / 1.18. */
export function TotalsList({ gross, discount, subtotal, igv, total, className }: TotalsListProps) {
  const hasDiscount = Number(discount) > 0;
  const rows: [string, string][] = [];
  if (hasDiscount && gross !== undefined) rows.push(["Subtotal", soles(gross)]);
  if (hasDiscount) rows.push(["Descuentos", `− ${soles(discount)}`]);
  rows.push(["Op. gravada", soles(subtotal)], ["IGV 18 %", soles(igv)]);
  return (
    <dl className={cn("flex flex-col gap-1", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 text-[13px] text-text-secondary">
          <dt>{label}</dt>
          <dd className={cn("font-mono", label === "Descuentos" && "text-accent-text")}>{value}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-3 pt-1">
        <dt className="text-[15px] font-semibold text-text-primary">Total</dt>
        <dd className="font-mono text-[22px] font-semibold text-text-primary">{soles(total)}</dd>
      </div>
    </dl>
  );
}
