"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS as c } from "./colors";
import { formatNumber, soles } from "@/lib/format";
import { ChartTooltip } from "./ChartTooltip";
import { useChartAnimation } from "@/components/charts/useChartAnimation";

export interface DailySalesPoint {
  date: string;
  /** Short axis label («28»). */
  label: string;
  /** Tooltip heading («mar 28 oct»). */
  tip: string;
  revenue: number;
  /** The latest day is highlighted in amber. */
  current: boolean;
}

/** Revenue per day as neutral bars; the current day in amber. */
export function DailySalesChart({ data, ariaLabel, height = 180 }: { data: DailySalesPoint[]; ariaLabel: string; height?: number }) {
  const anim = useChartAnimation();
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: c.muted, fontSize: 11 }} interval={0} dy={4} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: c.muted, fontSize: 11 }}
            width={56}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <Tooltip
            cursor={{ fill: c.grid, fillOpacity: 0.5 }}
            content={
              <ChartTooltip
                names={{ revenue: "Vendiste" }}
                format={(_, v) => soles(Number(v))}
                labelFormat={(l) => data.find((d) => d.label === l)?.tip ?? l}
              />
            }
          />
          <Bar dataKey="revenue" radius={[6, 6, 2, 2]} {...anim}>
            {data.map((d) => (
              <Cell key={d.date} fill={d.current ? c.primary : c.text} fillOpacity={d.current ? 1 : 0.14} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
