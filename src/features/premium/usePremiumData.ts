"use client";

import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { usePlan } from "@/hooks/usePlan";
import { billingPlansApi } from "@/services/api/billing";
import { ftgmApi } from "@/services/api/forecasting";

/**
 * Everything the plan screens show, all from the backend: the catalog (GET /billing/plans),
 * the subscription, this month's prediction quota and the payment history.
 */
export function usePremiumData() {
  const companyId = useCompanyId();
  const plan = usePlan();
  const plans = useApi(() => billingPlansApi.plans(), []);
  const quota = useApi(() => (companyId ? ftgmApi.quota(companyId) : Promise.resolve(null)), [companyId]);
  const payments = useApi(() => (companyId ? billingPlansApi.payments(companyId) : Promise.resolve(null)), [companyId]);

  const free = plans.data?.find((p) => p.id === "free");
  const premium = plans.data?.find((p) => p.id === "premium");

  const reload = () => {
    plan.reload();
    quota.reload();
    payments.reload();
  };

  return { companyId, plan, plans, free, premium, quota, payments, reload };
}
