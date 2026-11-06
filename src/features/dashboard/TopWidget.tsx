import Link from "next/link";
import { soles, units } from "@/lib/format";
import type { ErpSummary } from "@/types/forecasting";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";

/** Best sellers of the last 30 days, by money (from the ERP summary). */
export function TopWidget({ top }: { top: ErpSummary["top_products"] }) {
  const rows = top.slice(0, 5);
  const max = Math.max(1, ...rows.map((p) => p.revenue));

  return (
    <WidgetCard title="Lo que más sale" note="Últimos 30 días">
      {rows.length === 0 ? (
        <WidgetEmpty>
          Aún no hay ventas en los últimos 30 días.
        </WidgetEmpty>
      ) : (
        <ol className="flex flex-1 flex-col justify-between gap-1">
          {rows.map((p, i) => (
            <li key={p.product_id}>
              <Link
                href={`/inventory/${p.product_id}`}
                className="flex items-center gap-3 rounded-lg px-1.5 py-2 text-sm transition-colors hover:bg-surface-soft"
              >
                <span className="w-4 shrink-0 font-mono text-xs text-text-muted">{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-text-primary">{p.name}</span>
                  <span aria-hidden className="block h-1 rounded-full bg-surface-muted">
                    <span className="block h-1 rounded-full bg-text-secondary" style={{ width: `${(p.revenue / max) * 100}%` }} />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-[13px] text-text-primary">{soles(p.revenue)}</span>
                  <span className="block font-mono text-[11px] text-text-muted">{units(p.units)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </WidgetCard>
  );
}
