"use client";

import type { ForecastResultDTO } from "@/types/api";
import type { OverviewProduct } from "@/types/forecasting";
import { MethodsCard } from "./MethodsCard";
import { ProductForecastTable, type ProductRow } from "./ProductForecastTable";

/** «Cuánto venderás», product by product (the total is the stage's), and which method won. */
export function SalesForecastTab({
  products,
  rows,
  results,
  horizonDays,
  accuracy,
  excluded,
  expert,
  onOpen,
}: {
  products: OverviewProduct[];
  rows: ProductRow[];
  results: ForecastResultDTO[];
  horizonDays: number;
  accuracy: number | null | undefined;
  excluded: { product_id: string; name: string; reason: string }[];
  expert: boolean;
  onOpen: (productId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 min-[1700px]:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ProductForecastTable rows={rows} results={results} horizonDays={horizonDays} expert={expert} onOpen={onOpen} />
        <MethodsCard products={products} accuracy={accuracy} expert={expert} />
      </div>

      {excluded.length > 0 && (
        <details className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-text-secondary">
            {excluded.length} {excluded.length === 1 ? "producto quedó fuera" : "productos quedaron fuera"} por falta de ventas
          </summary>
          <ul className="mt-3 space-y-1 text-text-muted">
            {excluded.map((x) => (
              <li key={x.product_id}>
                <span className="text-text-secondary">{x.name}:</span> {x.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
