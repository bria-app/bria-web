"use client";

import { useApi } from "@/hooks/useApi";
import { recommendationsApi } from "@/services/api/resources";
import { dashboardApi } from "@/services/api/forecasting";
import { stockApi } from "@/services/api/inventory";
import { loadActivity } from "./activity";
import { loadTodayCash } from "./todayCash";

/**
 * Every real source the home screen reads. Each one loads (and fails) on its own,
 * so one slow endpoint never blanks the whole screen.
 */
export function useHomeData(companyId: string | null) {
  const summary = useApi(
    () => (companyId ? dashboardApi.erpSummary(companyId) : Promise.resolve(null)),
    [companyId],
  );
  const cash = useApi(() => (companyId ? loadTodayCash(companyId) : Promise.resolve(null)), [companyId]);
  const stock = useApi(
    () =>
      companyId
        ? Promise.all([stockApi.overview(companyId), recommendationsApi.list(companyId, true)]).then(([overview, recs]) => ({
            products: overview.items,
            recs,
          }))
        : Promise.resolve(null),
    [companyId],
  );
  const activity = useApi(() => (companyId ? loadActivity(companyId) : Promise.resolve(null)), [companyId]);

  return { summary, cash, stock, activity };
}
