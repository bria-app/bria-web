import type { ReactNode } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";
import { formatNumber, plural, soles, units } from "@/lib/format";
import type { ErpSummary } from "@/types/forecasting";
import { WidgetCard } from "./WidgetCard";

function Stat({ label, value, hint, hintTone }: { label: string; value: ReactNode; hint?: string; hintTone?: "success" | "danger" }) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-0.5 rounded-xl bg-surface-soft px-3 py-2.5">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="truncate font-mono text-[15px] text-text-primary sm:text-[17px]">{value}</dd>
      {hint && (
        <dd className={cn("text-[11px]", hintTone === "success" ? "text-success" : hintTone === "danger" ? "text-danger" : "text-text-muted")}>
          {hint}
        </dd>
      )}
    </div>
  );
}

/** The last 30 days (purchases: the calendar month) in four numbers, all from the ERP summary. */
export function MonthWidget({ s }: { s: ErpSummary }) {
  const change = s.revenue_change_pct;
  const changeHint =
    change == null ? undefined : `${change >= 0 ? "▲" : "▼"} ${formatNumber(Math.abs(change), 1)} % frente a los 30 días previos`;

  return (
    <WidgetCard title="Tu mes" note="Últimos 30 días">
      <dl className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 @2xl:grid-cols-4">
        <Stat label="Vendiste" value={<CountUp value={s.revenue_30d} format={soles} />} hint={changeHint} hintTone={change == null ? undefined : change >= 0 ? "success" : "danger"} />
        <Stat
          label="Venta promedio"
          value={s.avg_ticket_30d != null ? soles(s.avg_ticket_30d) : "—"}
          hint={`${plural(s.tickets_30d, "venta", "ventas")} en caja`}
        />
        <Stat
          label="Margen bruto"
          value={s.margin_pct_30d != null ? `${formatNumber(s.margin_pct_30d, 1)} %` : "—"}
          hint={s.revenue_30d > 0 ? `${soles(s.gross_margin_30d)} sobre el costo` : "Sin ventas"}
        />
        <Stat
          label="Compraste este mes"
          value={<CountUp value={s.purchases_month_total} format={soles} />}
          hint="Desde el día 1"
        />
      </dl>
      {s.lost_sales_30d_attempts > 0 && (
        <p className="mt-3 text-xs text-text-secondary">
          Te pidieron <span className="font-mono">{units(s.lost_sales_30d_units)}</span> que no tenías en {formatNumber(s.lost_sales_30d_attempts)}{" "}
          {s.lost_sales_30d_attempts === 1 ? "ocasión" : "ocasiones"}.
        </p>
      )}
    </WidgetCard>
  );
}
