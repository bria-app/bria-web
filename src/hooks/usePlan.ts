"use client";

import { useApi } from "./useApi";
import { useCompanyId } from "./useCompanyId";
import { billingApi } from "@/services/api/resources";
import type { SubscriptionDTO } from "@/types/api";
import { toDate } from "@/lib/format";

/**
 * Premium access now. The API's `is_premium` wins when it is sent; otherwise a premium that is
 * active, trialing or canceled counts only until its period end (an unpaid renewal expires).
 */
export function hasPremiumAccess(sub: SubscriptionDTO | null | undefined): boolean {
  if (!sub) return false;
  if (typeof sub.is_premium === "boolean") return sub.is_premium;
  if (sub.plan_id !== "premium" || !["active", "trialing", "canceled"].includes(sub.status)) return false;
  const end = toDate(sub.current_period_end).getTime();
  return !Number.isNaN(end) && end > Date.now();
}

/**
 * Current plan of the signed-in company. Free = the whole ERP plus 3 forecasts a month (any
 * scope, enforced by the API); Premium = unlimited forecasts. A missing subscription counts as free.
 */
export function usePlan() {
  const companyId = useCompanyId();
  const sub = useApi(
    () => (companyId ? billingApi.subscription(companyId).catch(() => null) : Promise.resolve(null)),
    [companyId],
  );
  const isPremium = hasPremiumAccess(sub.data);
  return { isPremium, loading: sub.loading, subscription: sub.data, reload: sub.reload };
}
