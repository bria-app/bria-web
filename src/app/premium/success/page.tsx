"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { useApi } from "@/hooks/useApi";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useCompanyId } from "@/hooks/useCompanyId";
import { usePlan } from "@/hooks/usePlan";
import { billingPlansApi } from "@/services/api/billing";
import { shortDate, soles } from "@/lib/format";
import { FlowFrame } from "@/features/premium/FlowFrame";
import { CYCLE_LABEL, METHOD_LABEL } from "@/features/premium/plan-data";

/** After the simulated checkout: the payment as the backend recorded it, and where to go next. */
export default function SuccessPage() {
  const router = useRouter();
  const reference = useQueryParam("ref");
  const companyId = useCompanyId();
  const plan = usePlan();
  const payments = useApi(() => (companyId ? billingPlansApi.payments(companyId) : Promise.resolve(null)), [companyId]);
  const payment = payments.data?.find((p) => p.reference === reference) ?? null;
  const until = plan.subscription?.current_period_end;

  // Only the checkout lands here (with ?ref=); opened by hand it would announce a plan nobody bought.
  useEffect(() => {
    if (!reference) router.replace("/premium");
  }, [reference, router]);

  return (
    <FlowFrame>
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex flex-col items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 aria-hidden className="h-6 w-6" />
          </span>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">Premium está activo</h1>
          <p className="text-[15px] leading-relaxed text-text-secondary">
            Desde ahora puedes lanzar todas las predicciones con IA que necesites, sin tope mensual.
          </p>
        </div>

        <DataState loading={payments.loading && !payments.data} error={payments.error} onRetry={payments.reload}>
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 text-sm">
            <dl className="grid grid-cols-2 gap-4">
              <div className="flex min-w-0 flex-col gap-1"><dt className="text-text-muted">Referencia</dt><dd className="font-mono [overflow-wrap:anywhere]">{reference || "Sin referencia"}</dd></div>
              <div className="flex min-w-0 flex-col gap-1"><dt className="text-text-muted">Monto</dt><dd className="font-mono">{payment ? soles(payment.amount) : "Sin dato"}</dd></div>
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-text-muted">Método</dt>
                <dd>
                  {payment ? METHOD_LABEL[payment.method] ?? payment.method : "Sin dato"}
                  {payment?.card_last4 && <span className="font-mono"> ···· {payment.card_last4}</span>}
                </dd>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <dt className="text-text-muted">{payment ? `${CYCLE_LABEL[payment.billing_cycle]} · activo hasta` : "Activo hasta"}</dt>
                <dd>{until ? shortDate(until) : "Sin dato"}</dd>
              </div>
            </dl>
            <p className="border-t border-border pt-3 text-[12.5px] text-text-muted">Pago de demostración: no se cobró nada. Lo ves en Configuración › Plan.</p>
          </div>
        </DataState>

        <div className="flex flex-wrap gap-3">
          <Link href="/forecasting" className="btn btn-primary h-12 px-6 text-[15px]">Ir a Pronóstico</Link>
          <Link href="/dashboard" className="btn btn-secondary h-12 px-5 text-sm">Volver a Hoy</Link>
        </div>
      </div>
    </FlowFrame>
  );
}
