"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export interface PrefillItem {
  productId: string;
  quantity: number;
}

const PARAMS = ["product", "cantidad"];

/**
 * Products to start a purchase with, from links such as
 * `/purchases/new?product=<id>&cantidad=<n>` (repeatable: `product=a&cantidad=2&product=b&cantidad=5`).
 * Read once on the first render, then removed from the URL so a reload starts clean. It asks the
 * router, not `window.location`: arriving by a link, the address bar only changes after this renders.
 */
export function usePurchasePrefill(): PrefillItem[] {
  const params = useSearchParams();
  const [items] = useState<PrefillItem[]>(() => {
    const quantities = params.getAll("cantidad");
    const seen = new Set<string>();
    return params.getAll("product").flatMap((productId, i) => {
      const id = productId.trim();
      if (!id || seen.has(id)) return [];
      seen.add(id);
      const n = Math.trunc(Number(quantities[i]));
      return [{ productId: id, quantity: Number.isFinite(n) && n > 0 ? n : 1 }];
    });
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!PARAMS.some((p) => url.searchParams.has(p))) return;
    PARAMS.forEach((p) => url.searchParams.delete(p));
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);

  return items;
}
