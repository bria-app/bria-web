"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { customFieldsApi } from "@/services/api/custom-fields";
import { posApi } from "@/services/api/pos";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { soles } from "@/lib/format";
import { ProductDetailCard } from "@/features/pos/ProductDetailCard";
import { STOCK_LABEL, StockBadge, stockTone, type StockTone } from "@/features/pos/StockBadge";
import { CATALOG_LIMIT } from "@/features/pos/useTillCatalog";
import type { CatalogProduct } from "@/types/pos";

const FILTERS: ("all" | StockTone)[] = ["all", "ok", "low", "out"];
const TH = "whitespace-nowrap px-3 py-3 text-[12px] font-semibold text-text-muted";

/** Consultar inventario: read-only price and units-left lookup (catalog endpoint, no costs). */
export default function StockLookupPage() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | StockTone>("all");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const catalog = useApi(() => (companyId ? posApi.catalog(companyId, q, CATALOG_LIMIT) : Promise.resolve([])), [companyId, q]);
  const fields = useApi(() => (companyId ? customFieldsApi.list(companyId, "product") : Promise.resolve([])), [companyId]);
  const labels = useMemo(() => Object.fromEntries((fields.data ?? []).map((f) => [f.key, f.label])), [fields.data]);

  const all = useMemo(() => (catalog.data ?? []).filter((p) => p.is_active), [catalog.data]);
  const counts = useMemo(() => {
    const c: Record<"all" | StockTone, number> = { all: all.length, ok: 0, low: 0, out: 0 };
    all.forEach((p) => c[stockTone(p.stock_on_hand, p.reorder_point)]++);
    return c;
  }, [all]);
  const items = filter === "all" ? all : all.filter((p) => stockTone(p.stock_on_hand, p.reorder_point) === filter);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Consultar inventario" description="Busca un producto para ver su precio y cuántos quedan." />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full sm:w-96">
            <span className="sr-only">Buscar producto</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, código (SKU) o de barras"
              className={inputClass(false, "pl-10")}
            />
          </label>
          <div role="group" aria-label="Inventario" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} count={counts[f]} onClick={() => setFilter(f)}>
                {f === "all" ? "Todos" : STOCK_LABEL[f]}
              </Chip>
            ))}
          </div>
        </div>

        <DataState
          loading={catalog.loading && !catalog.data}
          error={catalog.error}
          empty={!catalog.loading && items.length === 0}
          onRetry={catalog.reload}
          emptyState={
            filter !== "all" && all.length > 0 ? (
              <EmptyState icon={PackageSearch} title={`Ningún producto en «${STOCK_LABEL[filter]}»`} description="Elige otro filtro para ver el resto." />
            ) : q ? (
              <EmptyState icon={PackageSearch} title="No encontramos ese producto" description="Prueba con otro nombre o con el código de barras." />
            ) : (
              <EmptyState icon={PackageSearch} title="Aún no hay productos" description="Cuando se carguen productos, aquí verás su precio y cuántos quedan." />
            )
          }
        >
          <Card className="overflow-hidden p-0">
            <div className="relative overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-surface-soft">
                  <tr>
                    <th className={cn(TH, "pl-4 sm:pl-5")}>Producto</th>
                    <th className={cn(TH, "hidden lg:table-cell")}>Categoría</th>
                    <th className={cn(TH, "hidden text-right sm:table-cell")}>Precio</th>
                    <th className={cn(TH, "pr-4 sm:pr-5")}>Inventario</th>
                  </tr>
                </thead>
                <tbody className={cn(catalog.loading && "opacity-60")}>
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver ${p.name}`}
                      onClick={() => setSelected(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(p);
                        }
                      }}
                      className="h-[52px] cursor-pointer border-t border-border text-[14px] transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft"
                    >
                      <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5">
                        <p className="truncate font-medium text-text-primary">{p.name}</p>
                        <p className="truncate font-mono text-[12px] text-text-muted">
                          <span className="font-semibold text-text-primary sm:hidden">{soles(p.unit_price)} · </span>
                          {p.sku}
                          {p.barcode ? ` · ${p.barcode}` : ""}
                        </p>
                        {p.category_name && <p className="truncate text-[12.5px] text-text-muted lg:hidden">{p.category_name}</p>}
                      </td>
                      <td className="hidden px-3 py-2.5 text-text-secondary lg:table-cell">
                        <span className="block max-w-[200px] truncate">{p.category_name || "—"}</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-text-primary sm:table-cell">{soles(p.unit_price)}</td>
                      <td className="whitespace-nowrap py-2.5 pl-3 pr-4 sm:pr-5">
                        <StockBadge stock={p.stock_on_hand} reorderPoint={p.reorder_point} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {all.length >= CATALOG_LIMIT && (
              <p className="border-t border-border px-5 py-3 text-[12.5px] text-text-muted">
                Se muestran los primeros {CATALOG_LIMIT} productos. Escribe para afinar la búsqueda.
              </p>
            )}
          </Card>
        </DataState>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""} size="md">
        {selected && <ProductDetailCard product={selected} fieldLabels={labels} />}
      </Modal>
    </div>
  );
}
