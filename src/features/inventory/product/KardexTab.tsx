"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScrollShadow } from "@/components/ui/ScrollShadow";
import { dateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimelineEvent, TimelineKind } from "@/types/inventory";
import { kardexRow } from "./kardexRows";

type Filter = "all" | TimelineKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "sale", label: "Ventas" },
  { id: "restock", label: "Compras" },
  { id: "adjustment", label: "Ajustes" },
  { id: "lost_sale", label: "Pedidos perdidos" },
];

const PAGE = 50;

/**
 * «Entradas y salidas» from the product timeline. There is no running balance column: the
 * API does not return one, and imported sales may be history that never moved units.
 */
export function KardexTab({ events, truncated }: { events: TimelineEvent[]; truncated: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE);

  const all = useMemo(() => events.map(kardexRow), [events]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: all.length, sale: 0, restock: 0, adjustment: 0, lost_sale: 0 };
    for (const r of all) c[r.kind] += 1;
    return c;
  }, [all]);
  const rows = filter === "all" ? all : all.filter((r) => r.kind === filter);
  const anyImported = all.some((r) => r.imported);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de movimiento">
        {FILTERS.filter((f) => f.id === "all" || counts[f.id] > 0).map((f) => (
          <Chip
            key={f.id}
            active={filter === f.id}
            count={counts[f.id]}
            onClick={() => {
              setFilter(f.id);
              setLimit(PAGE);
            }}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <ScrollShadow>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-soft text-[12px] font-semibold text-text-muted">
                <th scope="col" className="hidden h-10 pl-5 pr-3 lg:table-cell">Cuándo</th>
                <th scope="col" className="h-10 pl-4 pr-3 sm:pl-5 lg:pl-3">Movimiento</th>
                <th scope="col" className="hidden px-3 lg:table-cell">Documento</th>
                <th scope="col" className="px-3 text-right">Entra</th>
                <th scope="col" className="pl-3 pr-4 text-right sm:pr-5">Sale</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r) => (
                <tr key={r.key} className="h-[52px] border-t border-border">
                  <td className="hidden whitespace-nowrap pl-5 pr-3 text-[13px] text-text-secondary lg:table-cell">{dateTime(r.at)}</td>
                  <td className="w-full max-w-0 py-2 pl-4 pr-3 sm:pl-5 lg:pl-3">
                    {r.href ? (
                      <Link href={r.href} className="block truncate font-semibold text-text-primary hover:underline">
                        {r.title}
                      </Link>
                    ) : (
                      <span className={cn("block truncate font-semibold", r.kind === "lost_sale" ? "text-danger" : "text-text-primary")}>{r.title}</span>
                    )}
                    <span className="block truncate text-[12.5px] text-text-muted">{r.detail}</span>
                    <span className="block truncate text-[12.5px] text-text-muted lg:hidden">
                      {dateTime(r.at)}
                      {r.document && <span className="font-mono"> · {r.document}</span>}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 font-mono text-[13px] text-text-secondary lg:table-cell">{r.document ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 text-right font-mono text-success">{r.entra != null ? `+${formatNumber(r.entra)}` : ""}</td>
                  <td className={cn("whitespace-nowrap pl-3 pr-4 text-right font-mono sm:pr-5", r.imported ? "text-text-muted" : "text-danger")}>
                    {r.sale != null ? `−${formatNumber(r.sale)}` : ""}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-muted">
                    Todavía no hay movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollShadow>
        {rows.length > limit && (
          <div className="border-t border-border px-5 py-3 text-center">
            <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
              Ver {formatNumber(Math.min(PAGE, rows.length - limit))} más
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1 text-[12.5px] text-text-muted">
        {truncated && <p>Mostramos los 150 más recientes de cada tipo.</p>}
        {anyImported && <p>Las ventas importadas desde Excel pueden ser solo historial: si al importarlas no elegiste descontarlas del inventario, no lo cambiaron.</p>}
      </div>
    </div>
  );
}
