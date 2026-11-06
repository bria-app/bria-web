"use client";

import { useMemo } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS as c } from "@/components/charts/colors";
import { formatNumber } from "@/lib/format";
import type { ProductTracking } from "@/types/forecasting";
import { useChartAnimation } from "@/components/charts/useChartAnimation";
import { ChartTooltip, LegendChip } from "@/components/charts/ChartTooltip";
import { periodLabel } from "./labels";

/** Forecast (amber, dashed) and its interval against actual sales (neutral bars), period by period. */
export function ForecastVsActualChart({ tracking, height = 240 }: { tracking: ProductTracking; height?: number }) {
  const anim = useChartAnimation();
  const data = useMemo(
    () =>
      tracking.rows.map((r) => ({
        name: r.period,
        forecast: r.forecast,
        band: r.lower != null && r.upper != null ? [r.lower, r.upper] : null,
        actual: r.actual != null && !r.partial ? r.actual : null,
        partial: r.actual != null && r.partial ? r.actual : null,
      })),
    [tracking],
  );
  const label = `Pronóstico frente a ventas reales de ${tracking.name}: esperado ≈ ${formatNumber(
    tracking.forecast_to_date,
  )} unidades hasta hoy, vendido ${formatNumber(tracking.actual_to_date)}.`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4">
        <LegendChip color={c.muted} label="Venta real" />
        <LegendChip color={c.accentText} label="Pronóstico" dashed />
        <LegendChip color={c.primary} label="Rango probable" />
      </div>
      <div role="img" aria-label={label} style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="name"
              tickFormatter={(v: string) => periodLabel(v, tracking.frequency)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: c.muted, fontSize: 11 }}
              dy={4}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: c.muted, fontSize: 11 }} width={44} />
            <Tooltip
              cursor={{ fill: c.grid, fillOpacity: 0.5 }}
              content={
                <ChartTooltip
                  names={{ forecast: "Pronóstico", band: "Rango probable", actual: "Venta real", partial: "Vendido a la fecha" }}
                  labelFormat={(l) => periodLabel(l, tracking.frequency)}
                />
              }
            />
            <Area dataKey="band" stroke="none" fill={c.primary} fillOpacity={0.18} {...anim} />
            <Bar dataKey="actual" fill={c.text} fillOpacity={0.16} radius={[6, 6, 2, 2]} maxBarSize={28} {...anim} />
            <Bar dataKey="partial" fill={c.text} fillOpacity={0.08} radius={[6, 6, 2, 2]} maxBarSize={28} {...anim} />
            <Line
              dataKey="forecast"
              stroke={c.accentText}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: c.accentText }}
              {...anim}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
