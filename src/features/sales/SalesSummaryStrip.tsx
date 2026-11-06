import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatNumber, soles, units } from "@/lib/format";
import { PAYMENT_LABEL, type SalesSummary } from "@/types/pos";
import { AnimatedFigure } from "@/components/ui/AnimatedFigure";

interface SalesSummaryStripProps {
  summary: SalesSummary | null;
  loading: boolean;
  /** Sellers never see costs or margins. */
  showMargin: boolean;
}

/** Totals for the filtered period (GET /sales-orders/summary), plus how customers paid. */
export function SalesSummaryStrip({ summary: s, loading, showMargin }: SalesSummaryStripProps) {
  const payments = (s?.by_payment_method ?? []).filter((p) => p.orders > 0);
  // A null margin means the API hid costs from this role: drop the tile instead of showing S/ 0.00.
  const margin = showMargin && s?.gross_margin !== null;

  return (
    <div data-sw-side="" className={cn("flex flex-col gap-3 transition-opacity", loading && "opacity-60")} aria-busy={loading || undefined}>
      {/* With three tiles (sellers), the last one spans the row on two columns instead of leaving a hole. */}
      <div className={cn("grid grid-cols-2 gap-3", margin ? "xl:grid-cols-4" : "lg:grid-cols-3 max-lg:[&>*:last-child]:col-span-2")}>
        <Stat label="Vendiste" value={s ? soles(s.revenue) : "—"} note={s ? `Sin IGV ${soles(s.revenue_net)}` : undefined} />
        <Stat
          label="Ventas"
          value={s ? formatNumber(s.orders) : "—"}
          note={s ? `${units(s.units)} vendidas${s.voided_orders ? ` · ${formatNumber(s.voided_orders)} anuladas` : ""}` : undefined}
        />
        <Stat label="Venta promedio" value={s ? soles(s.avg_ticket) : "—"} />
        {margin && (
          <Stat
            label="Ganaste"
            value={s?.gross_margin != null ? soles(s.gross_margin) : "—"}
            note={s?.margin_pct != null ? `Margen ${formatNumber(s.margin_pct, 1)} % sin IGV` : undefined}
          />
        )}
      </div>
      {payments.length > 0 && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
          <span className="text-[13px] font-semibold text-text-secondary">Cómo te pagaron</span>
          {payments.map((p) => (
            <span key={p.payment_method} className="text-[13px] text-text-secondary">
              {PAYMENT_LABEL[p.payment_method] ?? p.payment_method}{" "}
              <span className="font-mono text-text-primary">{soles(p.total)}</span>
              <span className="text-text-muted"> · {salesCount(p.orders)}</span>
            </span>
          ))}
        </Card>
      )}
    </div>
  );
}

const salesCount = (n: number) => `${formatNumber(n)} ${n === 1 ? "venta" : "ventas"}`;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="@container flex min-w-0 flex-col gap-1.5 p-5">
      <span className="text-[13px] font-medium text-text-secondary">{label}</span>
      {/* The figure scales with its tile, so «S/ 14,492.70» never spills out of a narrow one. */}
      <span className="whitespace-nowrap font-mono text-[clamp(17px,13cqi,24px)] leading-tight text-text-primary">
        <AnimatedFigure text={value} />
      </span>
      {note && <span className="text-[12px] text-text-muted">{note}</span>}
    </Card>
  );
}
