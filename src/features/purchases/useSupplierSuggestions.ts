"use client";

import { useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import { recommendationsApi } from "@/services/api/resources";
import { supplierInsightsApi } from "@/services/api/purchasing";
import type { RecommendationDTO } from "@/types/api";
import type { SuppliedProductDTO, SupplierSummaryDTO } from "@/types/purchasing";

export interface SupplierSuggestions {
  /** Products this supplier has sold you before, most bought first. */
  usual: SuppliedProductDTO[];
  /** Pending bria recommendations for those products: product id → quantity. */
  suggested: Map<string, number>;
}

const NONE: SupplierSuggestions = { usual: [], suggested: new Map() };

/**
 * What the chosen supplier usually sells you (from its purchase history) and which of
 * those products have a pending recommendation. The backend links products to suppliers
 * only through past purchases, so a supplier with no history has no suggestions.
 */
export function useSupplierSuggestions(companyId: string | null, supplierId: string): SupplierSuggestions {
  const summary = useApi<SupplierSummaryDTO | null>(
    () => (companyId && supplierId ? supplierInsightsApi.summary(companyId, supplierId) : Promise.resolve(null)),
    [companyId, supplierId],
  );
  const recs = useApi<RecommendationDTO[]>(
    () => (companyId ? recommendationsApi.list(companyId, true) : Promise.resolve([])),
    [companyId],
  );

  return useMemo(() => {
    const usual = summary.data && summary.data.supplier.id === supplierId ? summary.data.products : [];
    if (usual.length === 0) return NONE;
    const ids = new Set(usual.map((p) => p.product_id));
    const suggested = new Map<string, number>();
    for (const r of recs.data ?? []) {
      if (r.status === "pending" && r.recommended_quantity > 0 && ids.has(r.product_id) && !suggested.has(r.product_id)) {
        suggested.set(r.product_id, r.recommended_quantity);
      }
    }
    return { usual, suggested };
  }, [summary.data, recs.data, supplierId]);
}
