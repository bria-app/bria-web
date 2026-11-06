"use client";

import { useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import { categoriesApi, productsApi, suppliersApi } from "@/services/api/resources";
import type { CategoryDTO } from "@/types/api";
import type { ForecastScope } from "@/types/forecasting";
import type { ChoiceOption } from "./InlineChoice";

const ALL_SCOPE = "all";

function categoryPath(c: CategoryDTO, byId: Map<string, CategoryDTO>): string {
  const names = [c.name];
  let parent = c.parent_id ? byId.get(c.parent_id) : undefined;
  while (parent && names.length < 4) {
    names.unshift(parent.name);
    parent = parent.parent_id ? byId.get(parent.parent_id) : undefined;
  }
  return names.join(" › ");
}

/** What the forecast can cover, using only scopes the API supports: everything, a category, a supplier or one product. */
export function scopeFromValue(value: string): ForecastScope {
  const [kind, id] = value.split(":");
  if (kind === "cat") return { type: "category", category_id: id };
  if (kind === "sup") return { type: "supplier", supplier_id: id };
  if (kind === "prod") return { type: "products", product_ids: [id] };
  return { type: "all" };
}

/** The sentence's value for a run's scope, so it can say what the result on screen is about. */
export function valueFromScope(scope: ForecastScope | null | undefined): string | null {
  if (!scope) return null;
  if (scope.type === "all") return ALL_SCOPE;
  if (scope.type === "category" && scope.category_id) return `cat:${scope.category_id}`;
  if (scope.type === "supplier" && scope.supplier_id) return `sup:${scope.supplier_id}`;
  if (scope.type === "products" && scope.product_ids?.length === 1) return `prod:${scope.product_ids[0]}`;
  return null;
}

/**
 * Options for «Predice [...]». A `productId` (deep link from a product page) adds that product
 * and makes it the default.
 */
export function useScopeOptions(companyId: string | null, productId: string | null, alsoProductId?: string | null) {
  const categories = useApi(() => (companyId ? categoriesApi.list(companyId) : Promise.resolve([])), [companyId]);
  const suppliers = useApi(() => (companyId ? suppliersApi.list(companyId) : Promise.resolve([])), [companyId]);
  const product = useApi(
    () => (companyId && productId ? productsApi.get(companyId, productId).catch(() => null) : Promise.resolve(null)),
    [companyId, productId],
  );
  const also = useApi(
    () => (companyId && alsoProductId && alsoProductId !== productId ? productsApi.get(companyId, alsoProductId).catch(() => null) : Promise.resolve(null)),
    [companyId, alsoProductId, productId],
  );

  const options = useMemo<ChoiceOption[]>(() => {
    const out: ChoiceOption[] = [{ value: ALL_SCOPE, label: "Todos tus productos", phrase: "todos tus productos" }];
    if (product.data) {
      out.push({ value: `prod:${product.data.id}`, label: product.data.name, phrase: `«${product.data.name}»`, group: "Producto" });
    }
    if (also.data) {
      out.push({ value: `prod:${also.data.id}`, label: also.data.name, phrase: `«${also.data.name}»`, group: "Producto" });
    }
    const cats = categories.data ?? [];
    const byId = new Map(cats.map((c) => [c.id, c]));
    cats
      .map((c) => ({ c, path: categoryPath(c, byId) }))
      .sort((a, b) => a.path.localeCompare(b.path, "es"))
      .forEach(({ c, path }) => out.push({ value: `cat:${c.id}`, label: path, phrase: c.name, group: "Categoría" }));
    (suppliers.data ?? [])
      .filter((s) => s.is_active && s.purchase_lines > 0)
      .sort((a, b) => a.business_name.localeCompare(b.business_name, "es"))
      .forEach((s) =>
        out.push({ value: `sup:${s.id}`, label: s.business_name, phrase: `lo que compras a ${s.business_name}`, group: "Proveedor" }),
      );
    return out;
  }, [categories.data, suppliers.data, product.data, also.data]);

  const defaultValue = product.data ? `prod:${product.data.id}` : ALL_SCOPE;
  return { options, defaultValue };
}
