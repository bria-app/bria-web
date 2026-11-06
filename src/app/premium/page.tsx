"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataState } from "@/components/ui/DataState";
import { useRole } from "@/hooks/useRole";
import { ManagePlan } from "@/features/premium/ManagePlan";
import { PaymentsTable } from "@/features/premium/PaymentsTable";
import { PlanCompare } from "@/features/premium/PlanCompare";
import { PremiumFaq } from "@/features/premium/PremiumFaq";
import { UpgradeCard } from "@/features/premium/UpgradeCard";
import { PredictionTour } from "@/features/forecasting/tour/PredictionTour";
import { freeMonthlyLimit } from "@/features/premium/plan-data";
import { usePremiumData } from "@/features/premium/usePremiumData";
import { SettingsBlock } from "@/features/settings/SettingsBlock";
import type { BillingCycle } from "@/types/billing";

/** Plans: what the company uses today, what Premium changes and what it costs (all from the API). */
export default function PremiumPage() {
  const { isAdmin } = useRole();
  const router = useRouter();
  const data = usePremiumData();
  const { companyId, plan, plans, free, premium, quota, payments } = data;
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  // Only the first load shows the skeleton: a reload after cancel/resume keeps the page in place.
  const loading = (plans.loading && !plans.data) || (plan.loading && plan.subscription === null);
  const freeLimit = freeMonthlyLimit(free, quota.data);
  const isPremium = plan.isPremium && plan.subscription !== null;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8">
      <PageHeader
        title={isPremium ? "Tu plan" : "Planes"}
        description={isPremium ? "Cuándo se renueva, lo que pagaste y cómo cancelarlo." : "bria es gratis para vender, comprar y controlar tu inventario. Premium quita el tope de predicciones con IA."}
      />
      <DataState
        loading={loading}
        error={plans.error ?? (free && premium ? null : "No encontramos los planes. Inténtalo de nuevo en un momento.")}
        onRetry={plans.reload}
      >
        {free && premium && (
          <>
            {isPremium && companyId && plan.subscription ? (
              <>
                <ManagePlan companyId={companyId} subscription={plan.subscription} quota={quota.data} canManage={isAdmin} onChanged={data.reload} />
                <SettingsBlock title="Pagos" hint="Cada pago queda con su referencia.">
                  <DataState loading={payments.loading && !payments.data} error={payments.error} onRetry={payments.reload}>
                    <PaymentsTable payments={payments.data ?? []} />
                  </DataState>
                </SettingsBlock>
              </>
            ) : (
              <>
                <UpgradeCard premium={premium} quota={quota.data} freeLimit={freeLimit} canBuy={isAdmin} cycle={cycle} onCycle={setCycle} />
                {/* What Premium predicts with, told the same way Premium users see it. */}
                <section aria-labelledby="tour-title" className="flex flex-col gap-4">
                  <div>
                    <h2 id="tour-title" className="font-display text-lg font-bold text-text-primary">Así predice bria.</h2>
                    <p className="text-sm text-text-secondary">De tu caja a tu próxima compra, en siete pasos. Con Premium, cada vez que lo necesites.</p>
                  </div>
                  <PredictionTour
                    onDone={isAdmin ? () => router.push(`/premium/checkout?cycle=${cycle}`) : undefined}
                    doneLabel="Activar Premium"
                  />
                </section>
              </>
            )}
            <section aria-labelledby="compare-title" className="flex flex-col gap-3">
              <h2 id="compare-title" className="font-display text-lg font-bold text-text-primary">Gratis y Premium, lado a lado</h2>
              <PlanCompare free={free} premium={premium} freeLimit={freeLimit} current={isPremium ? "premium" : "free"} />
            </section>
            <PremiumFaq />
          </>
        )}
      </DataState>
    </div>
  );
}
