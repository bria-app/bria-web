"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ForecastResultDTO } from "@/types/api";
import type { OverviewProduct } from "@/types/forecasting";
import { ACTIONS, decide } from "./decisions";
import { approx, historyLabel, horizonLabel, isShortHistory, methodName } from "./labels";

export interface ProductRow {
  product: OverviewProduct;
  /** Periods of sales history the engine used. */
  periods: number;
}

const SPARK_W = 112;
const SPARK_H = 28;
const SPARK_PAST: Record<string, number> = { monthly: 12, weekly: 20 };

/** This product's recent sales and, dashed, its forecast: the shape of its row at a glance. */
function Spark({ result, frequency }: { result: ForecastResultDTO; frequency: string }) {
  const past = result.history.slice(-(SPARK_PAST[frequency] ?? 12)).map((h) => Number(h.observed) || 0);
  const future = result.points.map((p) => Number(p.predicted_demand) || 0);
  if (past.length === 0) return null;
  const all = [...past, ...future];
  // Its own range: this is the product's shape, not its size (the figures beside it say that).
  const max = Math.max(...all);
  const min = Math.min(...all);
  const x = (i: number) => (i / Math.max(1, all.length - 1)) * (SPARK_W - 4) + 2;
  const y = (v: number) => (max === min ? SPARK_H / 2 : SPARK_H - 3 - ((v - min) / (max - min)) * (SPARK_H - 6));
  const line = (from: number, values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(from + i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const last = past.length - 1;
  return (
    <svg aria-hidden width={SPARK_W} height={SPARK_H} className="block">
      <path d={line(0, past)} fill="none" stroke="rgb(var(--c-text-muted))" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {future.length > 0 && (
        <path
          d={line(last, [past[last], ...future])}
          fill="none"
          stroke="rgb(var(--c-accent-text))"
          strokeWidth={1.75}
          strokeDasharray="3 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** Per product, what can't wait first: what to do, its line, next period, horizon total, the method that won and its history. */
export function ProductForecastTable({
  rows,
  results,
  horizonDays,
  expert,
  onOpen,
}: {
  rows: ProductRow[];
  results: ForecastResultDTO[];
  horizonDays: number;
  expert: boolean;
  onOpen: (productId: string) => void;
}) {
  const resultOf = useMemo(() => new Map(results.map((r) => [r.product_id, r])), [results]);
  const freqs = new Set(rows.map((r) => r.product.frequency));
  const mixed = freqs.size > 1;
  const nextHeader = mixed ? "Próximo periodo" : freqs.has("weekly") ? "Próxima semana" : "Próximo mes";

  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5 sm:px-5">
        <h3 className="font-semibold text-text-primary">Producto por producto</h3>
        <p className="text-[13px] text-text-muted">Toca uno para ver su detalle</p>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Pronóstico por producto. Elige uno para ver su detalle.</caption>
          <thead>
            <tr className="whitespace-nowrap bg-surface-soft text-[12px] font-semibold text-text-muted">
              <th scope="col" className="py-3 pl-4 pr-3 sm:pl-5">Producto</th>
              <th scope="col" className="px-3 py-3">Qué hacer</th>
              <th scope="col" className="hidden px-3 py-3 md:table-cell">Tendencia</th>
              <th scope="col" className="py-3 pl-3 pr-4 text-right sm:pr-3">{nextHeader}</th>
              <th scope="col" className="hidden py-3 pl-3 pr-5 text-right sm:table-cell lg:pr-3">En {horizonLabel(horizonDays)}</th>
              <th scope="col" className="hidden px-3 py-3 xl:table-cell min-[1700px]:hidden">Método</th>
              <th scope="col" className="hidden py-3 pl-3 pr-3 text-right lg:table-cell">Historial</th>
              <th scope="col" className="w-9 pr-3"><span className="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product: p, periods }) => {
              const skipped = p.status === "skipped";
              const short = isShortHistory(periods, p.frequency);
              const method = skipped ? "Sin pronóstico" : methodName(p.model_used, expert);
              const action = skipped ? null : ACTIONS[decide(p).action];
              return (
                <tr
                  key={p.product_id}
                  onClick={() => onOpen(p.product_id)}
                  className="group h-[56px] cursor-pointer border-t border-border transition-colors hover:bg-primary-soft/40"
                >
                  <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(p.product_id);
                      }}
                      className="block max-w-full truncate text-left font-semibold text-text-primary hover:text-accent-text"
                    >
                      {p.name}
                    </button>
                    {expert && <span className="block truncate font-mono text-xs text-text-muted">{p.sku}</span>}
                    <span className="block truncate text-[12.5px] text-text-muted xl:hidden min-[1700px]:block">
                      {method}
                      <span className={cn("lg:hidden", short && "text-warning")}>
                        {" "}
                        · {historyLabel(periods, p.frequency)}
                        {short && " (poco)"}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{action ? <Badge tone={action.tone}>{action.title}</Badge> : <span className="text-text-muted">—</span>}</td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    {!skipped && resultOf.get(p.product_id) && <Spark result={resultOf.get(p.product_id)!} frequency={p.frequency} />}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono sm:pr-3">
                    {skipped ? "—" : approx(p.next_period_units)}
                    {/* Weekly and monthly products side by side: say which period each number is. */}
                    {mixed && !skipped && (
                      <span className="ml-1 font-sans text-[11.5px] text-text-muted">{p.frequency === "weekly" ? "semana" : "mes"}</span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap py-2.5 pl-3 pr-5 text-right font-mono sm:table-cell lg:pr-3">{skipped ? "—" : approx(p.total_forecast_units)}</td>
                  <td className="hidden px-3 py-2.5 text-text-secondary xl:table-cell min-[1700px]:hidden" title={expert && p.fallback_reason ? p.fallback_reason : undefined}>
                    <span className="block max-w-[220px] truncate">
                      {method}
                      {expert && p.order_selected > 0 && <span className="ml-1 font-mono text-xs text-text-muted">N={p.order_selected}</span>}
                    </span>
                  </td>
                  <td className={cn("hidden whitespace-nowrap py-2.5 pl-3 pr-3 text-right lg:table-cell", short ? "text-warning" : "text-text-secondary")}>
                    {historyLabel(periods, p.frequency)}
                    {short && <span className="ml-1 text-xs">(poco)</span>}
                  </td>
                  <td className="pr-3 text-text-muted">
                    <ChevronRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-text" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
