"use client";

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { Segmented } from "@/components/ui/Segmented";
import { CHART_COLORS as c } from "@/components/charts/colors";
import { formatNumber } from "@/lib/format";
import type { ForecastResultDTO } from "@/types/api";
import { useChartAnimation } from "@/components/charts/useChartAnimation";
import { ChartTooltip, LegendChip } from "@/components/charts/ChartTooltip";
import { buildDrilldownData } from "./drilldownData";
import { periodLabel } from "./labels";

type Range = "recent" | "all";

/**
 * One product: what it sold (solid neutral line) and what comes next (amber dashed line, with
 * the engine's interval as a soft band). Drawn exactly as the engine returned it: no ramp,
 * smoothing or invented band. The expert view adds the cleaned series, the model fit and the
 * sold-out and outlier marks.
 */
export function ForecastDrilldownChart({
  result,
  frequency,
  height = 280,
  simple = false,
}: {
  result: ForecastResultDTO;
  frequency: string;
  height?: number;
  simple?: boolean;
}) {
  const anim = useChartAnimation();
  const [range, setRange] = useState<Range>("recent");
  const built = useMemo(() => buildDrilldownData(result, frequency, range), [result, frequency, range]);
  const hasBand = built.boundedPoints > 0;
  const partialBand = hasBand && built.boundedPoints < built.predicted.length;
  const boundary = result.points[0]?.period_date;
  const total = built.predicted.reduce((a, b) => a + b, 0);
  const label = `Ventas pasadas y pronóstico de ${built.predicted.length} periodos: ≈ ${formatNumber(total)} unidades en total.`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <LegendChip color={c.muted} label={simple ? "Lo que vendiste" : "Demanda observada"} />
          <LegendChip color={c.accentText} label="Pronóstico" dashed />
          {hasBand && <LegendChip color={c.primary} label="Rango probable" />}
          {!simple && <LegendChip color={c.warning} label="Demanda reparada" />}
          {!simple && <LegendChip color={c.muted} label="Ajuste del modelo" dashed />}
          {!simple && <LegendChip color={c.danger} label="Agotado" />}
        </div>
        <Segmented
          label="Cuánta historia mostrar"
          size="sm"
          value={range}
          onChange={setRange}
          options={[
            { value: "recent", label: "Reciente" },
            { value: "all", label: "Toda" },
          ]}
        />
      </div>
      <div role="img" aria-label={label} style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={built.rows} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="name"
              tickFormatter={(v: string) => periodLabel(v, frequency)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: c.muted, fontSize: 11 }}
              minTickGap={20}
              dy={4}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: c.muted, fontSize: 11 }} width={44} />
            <Tooltip
              content={
                <ChartTooltip
                  names={
                    simple
                      ? { observed: "Vendiste", forecast: "Pronóstico", band: "Rango probable" }
                      : {
                          observed: "Observada",
                          cleaned: "Reparada",
                          fitted: "Ajuste",
                          forecast: "Pronóstico",
                          band: "Rango probable",
                          stockout: "Agotado",
                          outlier: "Atípico",
                        }
                  }
                  labelFormat={(l) => periodLabel(l, frequency)}
                />
              }
            />
            {boundary && (
              <ReferenceLine
                x={boundary}
                stroke={c.muted}
                strokeDasharray="3 4"
                label={{ value: "Hoy", position: "insideTopLeft", fill: c.muted, fontSize: 11, dy: -12 }}
              />
            )}
            <Area dataKey="band" stroke="none" fill={c.primary} fillOpacity={0.18} {...anim} connectNulls={false} />
            <Line
              dataKey="bridge"
              stroke={c.accentText}
              strokeOpacity={0.5}
              strokeWidth={1.5}
              strokeDasharray="2 4"
              dot={false}
              activeDot={false}
              {...anim}
              connectNulls={false}
            />
            <Line
              dataKey="forecast"
              stroke={c.accentText}
              strokeWidth={2.2}
              strokeDasharray="6 5"
              dot={false}
              activeDot={{ r: 4, fill: c.accentText, stroke: c.surface, strokeWidth: 2 }}
              {...anim}
              connectNulls={false}
            />
            <Line
              dataKey="observed"
              stroke={c.text}
              strokeOpacity={0.7}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: c.text, stroke: c.surface, strokeWidth: 2 }}
              {...anim}
              connectNulls={false}
            />
            {!simple && <Line dataKey="cleaned" stroke={c.warning} strokeWidth={0} dot={{ r: 3, fill: c.warning }} {...anim} />}
            {!simple && (
              <Line dataKey="fitted" stroke={c.muted} strokeWidth={1.5} strokeDasharray="5 4" dot={false} {...anim} />
            )}
            {!simple && <Scatter dataKey="stockout" fill={c.danger} {...anim} />}
            {!simple && <Scatter dataKey="outlier" fill={c.warning} shape="diamond" {...anim} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {result.points.length > 0 && (built.flat || !hasBand || partialBand) && (
        <div className="mt-2 space-y-0.5 text-xs text-text-muted">
          {built.flat && <p>No se ve temporada en este producto: el pronóstico es parejo.</p>}
          {!hasBand && <p>El motor no entregó un rango para este pronóstico.</p>}
          {partialBand && <p>Algunos periodos no tienen rango.</p>}
        </div>
      )}
    </div>
  );
}
