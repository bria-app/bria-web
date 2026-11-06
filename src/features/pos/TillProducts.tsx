"use client";

import { memo, RefObject, useMemo, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CatalogProduct } from "@/types/pos";
import { ProductGrid } from "./ProductGrid";
import { TillSearch } from "./TillSearch";
import { TouchChoice } from "./TouchChoice";
import { ALL_CATEGORIES, CATALOG_LIMIT, exactMatch, filterProducts, type TillCatalog } from "./useTillCatalog";

interface TillProductsProps {
  searchRef: RefObject<HTMLInputElement | null>;
  catalog: TillCatalog;
  /** Units of each product already in the sale. */
  quantities: ReadonlyMap<string, number>;
  onAdd: (product: CatalogProduct) => void;
  /** Adds the product with this exact code, asking the API when it is not in the loaded catalog. */
  onCode: (code: string) => Promise<void>;
  onOpenCamera: () => void;
  isSeller: boolean;
}

/**
 * Left side of the till: search, categories and the product grid. The search text lives here,
 * so typing only re-renders this side, and `memo` keeps it still while the sale panel changes.
 */
export const TillProducts = memo(function TillProducts({
  searchRef,
  catalog,
  quantities,
  onAdd,
  onCode,
  onOpenCamera,
  isSeller,
}: TillProductsProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const visible = useMemo(() => filterProducts(catalog.products, query, category), [catalog.products, query, category]);

  const onEnter = async () => {
    const code = query.trim();
    const exact = exactMatch(catalog.products, code);
    if (exact) onAdd(exact);
    else if (visible[0]) onAdd(visible[0]);
    else await onCode(code);
    setQuery("");
  };

  return (
    <section aria-label="Productos" className="flex min-w-0 flex-col gap-3">
      <TillSearch inputRef={searchRef} value={query} onChange={setQuery} onEnter={() => void onEnter()} onOpenCamera={onOpenCamera} />
      {catalog.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categorías">
          {[ALL_CATEGORIES, ...catalog.categories].map((c) => (
            <TouchChoice key={c || "all"} role="toggle" active={category === c} onClick={() => setCategory(c)} className="rounded-full px-4">
              {c || "Todas"}
            </TouchChoice>
          ))}
        </div>
      )}
      <DataState
        loading={catalog.loading}
        error={catalog.error}
        empty={visible.length === 0}
        onRetry={catalog.reload}
        emptyState={
          catalog.products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Aún no hay productos para vender"
              description={isSeller ? "Pídele a la dueña que cargue los productos." : "Crea o importa tus productos y vuelve a la caja."}
              action={isSeller ? undefined : { label: "Ir a Inventario", href: "/inventory" }}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-[14px] text-text-muted">
              No encontramos «{query.trim()}». Si es un código, presiona Enter para buscarlo exacto.
            </p>
          )
        }
      >
        <ProductGrid products={visible} quantities={quantities} onAdd={onAdd} />
      </DataState>
      {catalog.truncated && (
        <p className="text-[12.5px] text-text-muted">
          Se muestran los primeros {CATALOG_LIMIT} productos. Para otros, escanea o escribe su código exacto y presiona Enter.
        </p>
      )}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-text-muted">
        <span>
          <kbd className="font-mono">F2</kbd> buscar · <kbd className="font-mono">F9</kbd> cobrar
        </span>
        <Link href="/sales/stock" className="font-semibold text-accent-text hover:underline">
          Consultar inventario
        </Link>
      </p>
    </section>
  );
});
