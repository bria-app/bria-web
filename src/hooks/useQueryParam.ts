"use client";

import { useSearchParams } from "next/navigation";

/**
 * Reads `?<name>=` for links such as `/purchases/new?supplier=<id>`. It goes through the router,
 * not `window.location`: on an in-app navigation the address bar only changes after the new
 * screen's first render, so reading it directly returned the previous page's query.
 * No Suspense boundary is needed: `AppShell` renders screens on the client only.
 */
export function useQueryParam(name: string): string {
  return useSearchParams().get(name) ?? "";
}
