"use client";

import { useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import { posApi } from "@/services/api/pos";
import type { CatalogProduct } from "@/types/pos";

/** The catalog endpoint caps at 200 rows; beyond that the till relies on exact code lookup. */
export const CATALOG_LIMIT = 200;
export const ALL_CATEGORIES = "";

/** Lower case without accents, so «cafe» finds «Café». */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Active products, loaded once and filtered locally so typing feels instant. */
export function useTillCatalog(companyId: string | null, refreshKey: string | number) {
  const catalog = useApi(
    () => (companyId ? posApi.catalog(companyId, "", CATALOG_LIMIT) : Promise.resolve<CatalogProduct[]>([])),
    [companyId, refreshKey],
  );
  const products = useMemo(() => (catalog.data ?? []).filter((p) => p.is_active), [catalog.data]);
  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category_name).filter((c): c is string => !!c))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );

  const truncated = (catalog.data?.length ?? 0) >= CATALOG_LIMIT;
  const loading = catalog.loading && !catalog.data;
  const { error, reload } = catalog;
  // One stable object, so the memoised product side of the till skips renders while the sale changes.
  return useMemo(() => ({ products, categories, truncated, loading, error, reload }), [products, categories, truncated, loading, error, reload]);
}

export type TillCatalog = ReturnType<typeof useTillCatalog>;

// Name, SKU and barcode normalised once per product, not on every keystroke.
const searchText = new WeakMap<CatalogProduct, string>();
const haystack = (p: CatalogProduct) => {
  let text = searchText.get(p);
  if (text === undefined) {
    text = norm([p.name, p.sku, p.barcode ?? ""].join("\n"));
    searchText.set(p, text);
  }
  return text;
};

export function filterProducts(products: CatalogProduct[], query: string, category: string): CatalogProduct[] {
  const term = norm(query.trim());
  return products.filter(
    (p) => (category === ALL_CATEGORIES || p.category_name === category) && (!term || haystack(p).includes(term)),
  );
}

/** Exact barcode or SKU match, as a hardware scanner types it. */
export function exactMatch(products: CatalogProduct[], code: string): CatalogProduct | undefined {
  const c = code.trim().toLowerCase();
  return products.find((p) => p.barcode?.toLowerCase() === c || p.sku.toLowerCase() === c);
}
