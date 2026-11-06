"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/Badge";
import { ChartPlaceholder } from "@/components/charts/ChartPlaceholder";
import { useApi } from "@/hooks/useApi";
import { ftgmApi } from "@/services/api/forecasting";
import { formatNumber } from "@/lib/format";
import { dateLabel, pct, trackingMeta } from "./labels";

const CHART_HEIGHT = 220;
/** Legend row (28 px) drawn above the chart. */
const LEGEND_HEIGHT = 28;

// Opens inside the product dialog: recharts loads only then.
const ForecastVsActualChart = dynamic(() => import("./ForecastVsActualChart").then((m) => m.ForecastVsActualChart), {
  ssr: false,
  loading: () => <ChartPlaceholder height={CHART_HEIGHT + LEGEND_HEIGHT} />,
});

/** «¿Cómo va?»: this run's forecast against what the product actually sold since. */
export function ProductTracking({
  companyId,
  runId,
  productId,
  expert,
}: {
  companyId: string;
  runId: string;
  productId: string;
  expert: boolean;
}) {
  const tracking = useApi(() => ftgmApi.tracking(companyId, runId), [companyId, runId]);

  if (tracking.loading && !tracking.data) return <p className="text-sm text-text-muted">Cargando el seguimiento…</p>;
  if (tracking.error) return <p className="text-sm text-danger">{tracking.error}</p>;
  const t = tracking.data?.products.find((p) => p.product_id === productId);
  if (!t) return null;

  if (t.status === "pendiente") {
    return (
      <p className="text-sm text-text-secondary">
        {tracking.data?.as_of
          ? `Todavía no hay ventas después del ${dateLabel(tracking.data.as_of)} para comparar.`
          : "Todavía no hay ventas nuevas para comparar."}{" "}
        Se llena solo a medida que vendes.
      </p>
    );
  }

  const meta = trackingMeta[t.status];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span>
          Esperábamos <span className="font-mono text-text-primary">≈ {formatNumber(t.forecast_to_date)} u</span> hasta hoy y vendiste{" "}
          <span className="font-mono text-text-primary">{formatNumber(t.actual_to_date)} u</span>.
        </span>
        {expert && (
          <span className="text-xs text-text-muted">
            MAPE {pct(t.mape)} · sesgo {pct(t.bias_pct)}
            {t.within_band_share != null && ` · ${formatNumber(t.within_band_share * 100)} % dentro del intervalo`}
          </span>
        )}
      </div>
      <ForecastVsActualChart tracking={t} height={CHART_HEIGHT} />
    </div>
  );
}
