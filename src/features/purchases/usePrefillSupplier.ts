"use client";

import { useEffect, useRef } from "react";
import { catalogApi } from "@/services/api/inventory";

/**
 * The backend links a product to a supplier only through past purchases, so the supplier of
 * a pre-filled product is the one of its latest restock in the product timeline. Calls
 * `onFound` once with that supplier id; it never runs when `productId` is empty.
 */
export function usePrefillSupplier(companyId: string | null, productId: string, onFound: (supplierId: string) => void) {
  const found = useRef(onFound);

  useEffect(() => {
    found.current = onFound;
  }, [onFound]);

  useEffect(() => {
    if (!companyId || !productId) return;
    let active = true;
    catalogApi
      .timeline(companyId, productId)
      .then((t) => {
        const last = t.events
          .filter((e) => e.kind === "restock" && e.supplier_id)
          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0];
        if (active && last?.supplier_id) found.current(last.supplier_id);
      })
      .catch(() => {
        // Without history there is simply no supplier to suggest.
      });
    return () => {
      active = false;
    };
  }, [companyId, productId]);
}
