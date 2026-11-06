"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { ChartPlaceholder } from "@/components/charts/ChartPlaceholder";
import type { DailySalesPoint } from "@/components/charts/DailySalesChart";
import { dateLabel } from "@/features/forecasting/labels";
import { useApi } from "@/hooks/useApi";
import { dashboardApi } from "@/services/api/forecasting";
import { formatNumber, plural, soles } from "@/lib/format";
import { NumberTile } from "./NumberTile";

const DAYS = 14;
const CHART_HEIGHT = 180;

// Below the figures: recharts loads once the page is up.
const DailySalesChart = dynamic(() => import("@/components/charts/DailySalesChart").then((m) => m.DailySalesChart), {
  ssr: false,
  loading: () => <ChartPlaceholder height={CHART_HEIGHT} />,
});

/** Sales of the last 30 days, the margin they left and the money sitting in inventory. */
export function SalesSnapshot({ companyId }: { companyId: string }) {
  const summary = useApi(() => dashboardApi.erpSummary(companyId), [companyId]);
  const s = summary.data;

  const days: DailySalesPoint[] = (s?.sales_by_day ?? []).slice(-DAYS).map((d) => {
    const today = d.date === s?.today;
    const full = dateLabel(d.date);
    return {
      date: d.date,
      label: today ? "Hoy" : String(Number(d.date.slice(8, 10))),
      tip: today ? `Hoy, ${full}` : full,
      revenue: d.revenue,
      current: today,
    };
  });
  const sum14 = days.reduce((a, d) => a + d.revenue, 0);
  const change = s?.revenue_change_pct ?? null;

  return (
    <DataState loading={summary.loading && !s} error={summary.error} onRetry={summary.reload}>
      {s && (
        <section aria-labelledby="ventas-30" className="space-y-4">
          <h2 id="ventas-30" className="font-display text-lg font-bold text-text-primary">
            Tus ventas
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NumberTile
              label="Vendido en 30 días"
              value={soles(s.revenue_30d)}
              note={change == null ? "Sin mes anterior para comparar" : `${change > 0 ? "+" : ""}${formatNumber(change, 1)} % frente a los 30 días anteriores`}
              tone={change == null ? undefined : change >= 0 ? "success" : "danger"}
            />
            <NumberTile
              label="Margen bruto en 30 días"
              value={soles(s.gross_margin_30d)}
              note={s.margin_pct_30d == null ? "Sin ventas en 30 días" : `${formatNumber(s.margin_pct_30d, 1)} % de lo vendido`}
            />
            <NumberTile
              label="Venta promedio"
              value={s.avg_ticket_30d == null ? "—" : soles(s.avg_ticket_30d)}
              note={`${plural(s.tickets_30d, "venta", "ventas")} en 30 días`}
            />
            <NumberTile label="Plata en tu almacén" value={soles(s.inventory_value)} note="Tu inventario a costo promedio" />
          </div>
          <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-text-primary">Ventas · últimos {DAYS} días</h3>
              <span className="font-mono text-sm text-text-secondary">{soles(sum14)}</span>
            </div>
            <DailySalesChart data={days} height={CHART_HEIGHT} ariaLabel={`Ventas por día de los últimos ${DAYS} días: ${soles(sum14)} en total.`} />
          </Card>
        </section>
      )}
    </DataState>
  );
}
