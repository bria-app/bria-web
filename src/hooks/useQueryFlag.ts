"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * True when the page was opened with `?<name>=1` (e.g. «Crear → Producto» links to
 * `/products?nuevo=1`). The flag is consumed once and removed from the URL, so a reload or
 * the back button does not reopen the form.
 * It reads the query through the router, not `window.location`: on an in-app navigation the
 * address bar only changes after the new screen's first render (see `useQueryParam`).
 */
export function useQueryFlag(name: string): boolean {
  const params = useSearchParams();
  const [flag] = useState(() => params.get(name) === "1");

  useEffect(() => {
    if (!flag) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(name)) return;
    url.searchParams.delete(name);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [flag, name]);

  return flag;
}
