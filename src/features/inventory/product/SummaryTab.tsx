import dynamic from "next/dynamic";
import { ProductForecastCard } from "./ProductForecastCard";
import { ProductInsights } from "./ProductInsights";
import { salesInsights } from "./salesInsights";
import { formatNumber, percent, shortDate, soles } from "@/lib/format";
import type { ProductDTO } from "@/types/api";
import type { ProductTimeline, StockStatus } from "@/types/inventory";
import { coverageText, marginPct, maybeNumber, unitLabel } from "@/features/inventory/stockStatus";
import { KpiTile } from "./KpiTile";

// The charts sit below the figures; recharts loads after the page is up.
const ProductCharts = dynamic(() => import("./ProductCharts").then((m) => m.ProductCharts), {
  ssr: false,
  loading: () => <div aria-hidden className="h-[322px] rounded-2xl border border-border bg-surface" />,
});

interface SummaryTabProps {
  companyId: string | null;
  product: ProductDTO;
  timeline: ProductTimeline;
  status: StockStatus;
}

/**
 * «Resumen»: real inventory and sales figures, what that history says and its charts; the
 * forecast advice only appears when a run exists.
 */
export function SummaryTab({ companyId, product, timeline, status }: SummaryTabProps) {
  const s = timeline.stats;
  const u = unitLabel(product.unit_of_measure);
  const price = Number(product.unit_price);
  const margin = marginPct(price, maybeNumber(product.unit_cost));
  const coverage = coverageText(s.coverage_days);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Tienes"
          value={`${formatNumber(s.stock_on_hand)} ${u}`}
          note={`Mínimo ${formatNumber(product.safety_stock)} · comprar al llegar a ${formatNumber(product.reorder_point)}`}
          tone={status === "ok" ? "neutral" : status === "reordenar" ? "warning" : "danger"}
        />
        <KpiTile
          label="Te alcanza para"
          value={coverage ?? "—"}
          note={coverage ? "Al ritmo de tu pronóstico o de tus ventas de 30 días." : "Sin ventas en los últimos 30 días."}
          tone={s.coverage_days != null && s.coverage_days < 7 ? "danger" : "neutral"}
        />
        <KpiTile
          label="Vendiste en 30 días"
          value={`${formatNumber(s.units_sold_30d)} ${u}`}
          note={`${formatNumber(s.units_sold_90d)} en 90 días · ${formatNumber(s.units_sold_365d)} en el año`}
        />
        <KpiTile label="Precio" value={soles(price)} note={!(price > 0) ? "Sin precio de venta" : margin == null ? undefined : `Margen ${percent(margin / 100)} sobre tu costo promedio`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Vendido en 12 meses" value={soles(s.revenue_365d)} note={s.avg_price_365d != null ? `Precio promedio ${soles(s.avg_price_365d)}` : "Sin ventas en el año"} />
        <KpiTile
          label="Te pidieron y no había"
          value={formatNumber(s.lost_sale_attempts_30d)}
          note={s.lost_sale_attempts ? `En 30 días · ${formatNumber(s.lost_units)} ${u} sin vender en total` : "Nunca te faltó al vender"}
          tone={s.lost_sale_attempts_30d > 0 ? "danger" : "neutral"}
        />
        <KpiTile label="Compras registradas" value={formatNumber(s.restock_count)} note={s.last_restock_at ? `Última: ${shortDate(s.last_restock_at)}` : "Aún no le compraste"} />
        <KpiTile label="Última venta" value={s.last_sale_at ? shortDate(s.last_sale_at) : "—"} note={s.last_sale_at ? undefined : "Todavía no se vende"} />
      </div>

      <ProductInsights productId={product.id} insights={salesInsights(timeline, u)} />

      <ProductCharts timeline={timeline} />

      <ProductForecastCard companyId={companyId} productId={product.id} />
    </div>
  );
}
