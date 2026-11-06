"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { useApi } from "@/hooks/useApi";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useCompanyId } from "@/hooks/useCompanyId";
import { usePlan } from "@/hooks/usePlan";
import { useRole } from "@/hooks/useRole";
import { billingPlansApi } from "@/services/api/billing";
import { CheckoutSummary } from "@/features/premium/CheckoutSummary";
import { FlowFrame } from "@/features/premium/FlowFrame";
import { PaymentFields } from "@/features/premium/PaymentFields";
import { EMPTY_PAYMENT, paymentErrors, toPayload, type PaymentState } from "@/features/premium/payment";
import { addCycle, parseCycle } from "@/features/premium/plan-data";
import type { BillingCycle } from "@/types/billing";
import { toDate } from "@/lib/format";

/** Simulated checkout (POST /billing/checkout): no real charge, and the page says so. */
export default function CheckoutPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const plan = usePlan();
  const { isAdmin } = useRole();
  const plans = useApi(() => billingPlansApi.plans(), []);
  const cycleParam = useQueryParam("cycle");
  const [cycle, setCycleState] = useState<BillingCycle>(() => parseCycle(cycleParam));
  const [payment, setPayment] = useState<PaymentState>(EMPTY_PAYMENT);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const premium = plans.data?.find((p) => p.id === "premium");
  const errors = paymentErrors(payment);
  const currentEnd = plan.subscription?.current_period_end ? toDate(plan.subscription.current_period_end) : null;
  const extending = plan.isPremium && currentEnd !== null && currentEnd.getTime() > now;
  const until = addCycle(extending && currentEnd ? currentEnd : new Date(now), cycle);

  const setCycle = (c: BillingCycle) => {
    setCycleState(c);
    window.history.replaceState(window.history.state, "", `/premium/checkout?cycle=${c}`);
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    if (!companyId || Object.keys(errors).length) return;
    setSending(true);
    try {
      const result = await billingPlansApi.checkout(companyId, toPayload(payment, cycle));
      plan.reload();
      router.replace(`/premium/success?ref=${encodeURIComponent(result.payment.reference)}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo registrar el pago. Inténtalo de nuevo.");
      setSending(false);
    }
  };

  return (
    <FlowFrame back={{ href: "/premium", label: "Volver a planes" }}>
      <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">{extending ? "Pagar otro periodo" : "Activar Premium"}</h1>
      <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        Pago de demostración: Premium se activa de verdad en tu cuenta, pero no se cobra nada ni se procesa ninguna tarjeta.
      </p>

      <div className="mt-7">
        <DataState loading={plans.loading && !plans.data} error={plans.error ?? (premium ? null : "No encontramos el plan Premium. Inténtalo de nuevo en un momento.")} onRetry={plans.reload}>
          {premium && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <form id="checkout-form" onSubmit={pay} noValidate className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold">Forma de pago</h2>
                <PaymentFields value={payment} onChange={setPayment} errors={submitted ? errors : {}} />
                {!isAdmin && (
                  <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Solo el dueño o un administrador puede activar Premium.</p>
                )}
                {apiError && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{apiError}</p>}
              </form>
              <CheckoutSummary
                premium={premium}
                cycle={cycle}
                onCycle={setCycle}
                until={until}
                extending={extending}
                sending={sending}
                disabled={!isAdmin || !companyId}
              />
            </div>
          )}
        </DataState>
      </div>
    </FlowFrame>
  );
}
