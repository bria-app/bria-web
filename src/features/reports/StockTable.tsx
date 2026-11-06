import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDTO } from "@/types/api";
import { hasDemand, stockState, type KpiRow, type StockState } from "./kpiRows";

const STATE: Record<StockState, { label: string; tone: BadgeTone; bar: string }> = {
  se_acaba: { label: "Se acaba", tone: "danger", bar: "bg-danger" },
  de_sobra: { label: "De sobra", tone: "info", bar: "bg-info" },
  en_orden: { label: "En orden", tone: "success", bar: "bg-success" },
};

const BAR_DAYS = 60;

const dayCount = (days: number) => `${formatNumber(days)} ${Math.round(days) === 1 ? "día" : "días"}`;

/** Per product: how long the inventory lasts, its state and (expert) turnover. */
export function StockTable({
  rows,
  productOf,
  expert,
}: {
  rows: KpiRow[];
  productOf: (id: string) => ProductDTO | undefined;
  expert: boolean;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Cuánto te dura el inventario de cada producto</caption>
          <thead>
            <tr className="bg-surface-soft text-[12px] font-semibold text-text-muted">
              <th scope="col" className="py-3 pl-4 pr-3 sm:pl-5">Producto</th>
              <th scope="col" className="whitespace-nowrap py-3 pl-3 pr-4 text-right sm:pr-3">{expert ? "Cobertura" : "Te alcanza"}</th>
              {expert && <th scope="col" className="hidden whitespace-nowrap px-3 py-3 text-right lg:table-cell">Rotación</th>}
              <th scope="col" className="hidden py-3 pl-3 pr-5 sm:table-cell xl:pr-3">Estado</th>
              <th scope="col" className="hidden w-56 whitespace-nowrap py-3 pl-3 pr-5 xl:table-cell">Hasta {BAR_DAYS} días</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = productOf(r.productId);
              const state = STATE[stockState(r)];
              const days = hasDemand(r) ? (r.coverage ?? 0) : null;
              return (
                <tr key={r.productId} className="h-[52px] border-t border-border">
                  <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5">
                    {p ? (
                      <Link href={`/inventory/${p.id}`} className="block truncate font-semibold text-text-primary hover:text-accent-text">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">Producto eliminado</span>
                    )}
                    {expert && p && <span className="block truncate font-mono text-xs text-text-muted">{p.sku}</span>}
                    <span className="mt-1 block sm:hidden">
                      <Badge tone={state.tone}>{state.label}</Badge>
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 pr-4 text-right font-mono sm:pr-3">
                    {days == null ? (
                      <span className="font-sans text-[13px] text-text-muted">Sin ventas previstas</span>
                    ) : (
                      <span className="whitespace-nowrap">{dayCount(days)}</span>
                    )}
                  </td>
                  {expert && (
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono lg:table-cell">{r.turnover == null ? "—" : `${formatNumber(r.turnover, 2)}×`}</td>
                  )}
                  <td className="hidden py-2.5 pl-3 pr-5 sm:table-cell xl:pr-3">
                    <Badge tone={state.tone}>{state.label}</Badge>
                  </td>
                  <td className="hidden py-2.5 pl-3 pr-5 xl:table-cell">
                    <span aria-hidden className="block h-2 rounded-full bg-surface-muted">
                      <span
                        className={cn("block h-2 rounded-full", state.bar)}
                        style={{ width: `${Math.max(3, Math.round((Math.min(BAR_DAYS, days ?? BAR_DAYS) / BAR_DAYS) * 100))}%` }}
                      />
                    </span>
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
