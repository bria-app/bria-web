"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS as colors } from "@/components/charts/colors";
import { Segmented } from "@/components/ui/Segmented";
import { formatNumber, shortDate, soles, units } from "@/lib/format";
import type { ProductTimeline } from "@/types/inventory";
import { monthShort } from "./salesInsights";

interface MonthPoint {
  label: string;
  units: number;
  revenue: number;
  lost: number;
  /** Same month a year before; null when the series does not reach that far. */
  prev: number | null;
  partial: boolean;
}
interface WeekPoint {
  label: string;
  units: number;
  revenue: number;
  stockout: number;
  lost: number;
  partial: boolean;
}
interface StockPoint {
  label: string;
  stock: number;
  inbound: number;
  outbound: number;
}

interface TipProps<T> {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: T }>;
}

function Tip({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12.5px] shadow-soft-lg">
      <p className="mb-1 font-semibold text-text-primary">{title}</p>
      {lines.map(([k, v]) => (
        <p key={k} className="flex justify-between gap-4 text-text-secondary">
          {k}
          <span className="font-mono text-text-primary">{v}</span>
        </p>
      ))}
    </div>
  );
}

function MonthTip({ active, payload }: TipProps<MonthPoint>) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const lines: [string, string][] = [["Unidades", formatNumber(p.units)], ["Vendido", soles(p.revenue)]];
  if (p.prev != null) lines.push(["Un año antes", formatNumber(p.prev)]);
  if (p.lost) lines.push(["Pedidas sin stock", formatNumber(p.lost)]);
  return <Tip title={p.partial ? `${p.label} (hasta hoy)` : p.label} lines={lines} />;
}

function WeekTip({ active, payload }: TipProps<WeekPoint>) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const lines: [string, string][] = [["Unidades", formatNumber(p.units)], ["Vendido", soles(p.revenue)]];
  if (p.stockout) lines.push(["Días sin stock", formatNumber(p.stockout)]);
  if (p.lost) lines.push(["Pedidas sin stock", formatNumber(p.lost)]);
  return <Tip title={`Semana del ${p.label}${p.partial ? " (hasta hoy)" : ""}`} lines={lines} />;
}

function StockTip({ active, payload }: TipProps<StockPoint>) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const lines: [string, string][] = [["Quedaban", units(p.stock)]];
  if (p.inbound) lines.push(["Entró", `+${formatNumber(p.inbound)}`]);
  if (p.outbound) lines.push(["Salió", `−${formatNumber(p.outbound)}`]);
  return <Tip title={p.label} lines={lines} />;
}

/** Stretches with nothing on hand, from the first empty day to the day stock came back (or the last day). */
function emptyRuns(days: StockPoint[]): [string, string][] {
  const runs: [string, string][] = [];
  let start: string | null = null;
  days.forEach((d, i) => {
    if (d.stock <= 0 && start == null) start = d.label;
    if (start != null && (d.stock > 0 || i === days.length - 1)) {
      runs.push([start, d.label]);
      start = null;
    }
  });
  return runs;
}

const dayMonth = (iso: string) => shortDate(iso).replace(/ \d{4}$/, "");

type View = "meses" | "semanas";

/** Real history only: units sold by month (against a year before) or by week, and units on hand day by day. */
export function ProductCharts({ timeline }: { timeline: Pick<ProductTimeline, "monthly_sales" | "weekly_sales" | "stock_series"> }) {
  const [view, setView] = useState<View>("meses");
  const all = timeline.monthly_sales;
  const shown = all.slice(-12);
  const offset = all.length - shown.length;
  const months: MonthPoint[] = shown.map((m, i) => ({
    label: monthShort(m.month),
    units: m.units,
    revenue: Number(m.revenue),
    lost: m.lost_units,
    prev: offset + i - 12 >= 0 ? all[offset + i - 12].units : null,
    partial: i === shown.length - 1,
  }));
  const hasPrev = months.some((m) => (m.prev ?? 0) > 0);
  const weeks: WeekPoint[] = timeline.weekly_sales.map((w, i, ws) => ({
    label: dayMonth(w.week_start),
    units: w.units,
    revenue: Number(w.revenue),
    stockout: w.stockout_days,
    lost: w.lost_units,
    partial: i === ws.length - 1,
  }));
  const days: StockPoint[] = timeline.stock_series.map((p) => ({ ...p, label: shortDate(p.date) }));
  const runs = emptyRuns(days);
  const axis = { fontSize: 11, fill: colors.muted };
  const sold = all.some((m) => m.units > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section aria-label="Ventas" className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary">Ventas</h2>
            <p className="text-[12.5px] text-text-muted">
              {view === "meses"
                ? hasPrev
                  ? "Unidades por mes; en gris, el mismo mes un año antes."
                  : "Unidades por mes en el último año."
                : "Unidades por semana; en rojo, las semanas en que te faltó stock algún día."}
            </p>
          </div>
          <Segmented<View>
            label="Ver ventas por"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: "meses", label: "Meses" },
              { value: "semanas", label: "Semanas" },
            ]}
          />
        </div>
        {sold ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              {view === "meses" ? (
                <BarChart data={months} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={14} />
                  <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: colors.grid, opacity: 0.5 }} content={<MonthTip />} />
                  {hasPrev && <Bar dataKey="prev" fill={colors.muted} fillOpacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={14} />}
                  <Bar dataKey="units" fill={colors.primary} radius={[5, 5, 0, 0]} maxBarSize={hasPrev ? 14 : 26} />
                </BarChart>
              ) : (
                <BarChart data={weeks} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: colors.grid, opacity: 0.5 }} content={<WeekTip />} />
                  {/* A week with no stock at all has no bar to paint red: shade its slot instead. */}
                  {weeks
                    .filter((w) => w.stockout && !w.units)
                    .map((w) => (
                      <ReferenceArea key={w.label} x1={w.label} x2={w.label} fill={colors.danger} fillOpacity={0.14} strokeOpacity={0} />
                    ))}
                  <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={18}>
                    {weeks.map((w) => (
                      <Cell key={w.label} fill={w.stockout ? colors.danger : colors.primary} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-text-muted">Todavía no hay ventas de este producto.</p>
        )}
      </section>
      <section aria-label="Inventario día a día" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-text-primary">Inventario día a día</h2>
        <p className="mb-4 text-[12.5px] text-text-muted">
          Cuántas unidades tuviste cada día de los últimos 6 meses{runs.length ? "; en rojo, los días sin stock." : "."}
        </p>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={48} />
              <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<StockTip />} />
              {runs.map(([x1, x2]) => (
                <ReferenceArea key={x1} x1={x1} x2={x2} fill={colors.danger} fillOpacity={0.14} strokeOpacity={0} ifOverflow="extendDomain" />
              ))}
              <Area type="stepAfter" dataKey="stock" stroke={colors.text} strokeWidth={1.75} fill={colors.text} fillOpacity={0.06} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
