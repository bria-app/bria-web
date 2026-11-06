"use client";

import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListStatus } from "@/components/ui/ListStatus";
import { useInfiniteList, useLoadsMore } from "@/hooks/useInfiniteList";
import { salesApi } from "@/services/api/resources";
import { cn } from "@/lib/utils";
import { formatNumber, shortDate, soles, units } from "@/lib/format";

const PAGE_SIZE = 50;
const TH = "whitespace-nowrap px-3 py-3 text-[12px] font-semibold text-text-muted";

/**
 * Raw sale lines loaded from spreadsheets (GET /sales?origin=imported). Older history, such as the
 * demo seed, exists only as lines without a sale order, so it does not show up in the «Ventas» tab.
 * Each line brings its product's name and code, so the catalog is not downloaded here.
 */
export function ImportedHistory({ companyId, refreshKey }: { companyId: string; refreshKey: number }) {
  const sales = useInfiniteList(
    (page) => salesApi.list(companyId, page, PAGE_SIZE, "imported").then((items) => ({ items, hasMore: items.length === PAGE_SIZE })),
    (s) => s.id,
    [companyId, refreshKey],
  );
  useLoadsMore(sales);
  const rows = sales.items;

  return (
    <DataState
      loading={sales.loading && rows.length === 0}
      error={sales.error}
      empty={!sales.loading && rows.length === 0}
      onRetry={sales.reload}
      emptyState={
        <EmptyState
          icon={FileSpreadsheet}
          title="Aún no cargaste ventas pasadas"
          description="Si llevabas tus ventas en Excel u otro sistema, súbelas con «Importar ventas». Ayudan a que el pronóstico salga mejor."
        />
      }
    >
      <Card className="overflow-clip p-0">
        <p className="border-b border-border px-5 py-3 text-[13px] text-text-secondary">
          Líneas de venta que cargaste desde un archivo, una por producto.
        </p>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-soft">
              <tr>
                <th className={cn(TH, "hidden pl-5 lg:table-cell")}>Fecha</th>
                <th className={cn(TH, "pl-4 sm:pl-5 lg:pl-3")}>Producto</th>
                <th className={cn(TH, "hidden text-right sm:table-cell")}>Cantidad</th>
                <th className={cn(TH, "hidden text-right lg:table-cell")}>Precio</th>
                <th className={cn(TH, "pr-4 text-right sm:pr-5")}>Total</th>
              </tr>
            </thead>
            <tbody className={cn(sales.loading && "opacity-60")}>
              {rows.map((s) => {
                const day = shortDate(`${s.sale_date}T12:00:00`);
                return (
                  <tr key={s.id} className="h-[52px] border-t border-border text-[14px]">
                    <td className="hidden whitespace-nowrap py-2.5 pl-5 pr-3 text-text-secondary lg:table-cell">{day}</td>
                    <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5 lg:pl-3">
                      <Link href={`/inventory/${s.product_id}`} className="block truncate text-text-primary hover:text-accent-text">
                        {s.product_name || "Producto"}
                      </Link>
                      <p className="truncate text-[12.5px] text-text-muted">
                        {s.sku && <span className="font-mono">{s.sku}</span>}
                        <span className="lg:hidden">
                          {s.sku ? " · " : ""}
                          {day}
                        </span>
                        <span className="sm:hidden">
                          {" "}
                          · {units(s.quantity)} × {soles(s.unit_price)}
                        </span>
                        <span className="hidden sm:inline lg:hidden"> · {soles(s.unit_price)} c/u</span>
                      </p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono sm:table-cell">{units(s.quantity)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-text-secondary lg:table-cell">{soles(s.unit_price)}</td>
                    <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono text-text-primary sm:pr-5">{soles(s.total_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ListStatus variant="table" loading={sales.loadingMore} onRetry={sales.moreFailed ? sales.loadMore : undefined}>
          {formatNumber(rows.length)} {rows.length === 1 ? "línea" : "líneas"}
          {sales.hasMore && " por ahora"}
        </ListStatus>
      </Card>
    </DataState>
  );
}
