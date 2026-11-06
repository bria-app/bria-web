"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { soles, shortDate } from "@/lib/format";
import { PaymentsTable } from "@/features/premium/PaymentsTable";
import { QuotaMeter } from "@/features/premium/QuotaMeter";
import { freeMonthlyLimit } from "@/features/premium/plan-data";
import { usePremiumData } from "@/features/premium/usePremiumData";
import { PredictionTourModal } from "@/features/forecasting/tour/PredictionTourModal";
import { SettingsBlock } from "./SettingsBlock";

/** Configuración › Plan: the plan today, this month's usage and the payments, all from the API. */
export function PlanSection() {
  const { plan, free, premium, quota, payments, plans } = usePremiumData();
  const isPremium = plan.isPremium;
  const sub = plan.subscription;
  const limit = freeMonthlyLimit(free, quota.data);
  const out = quota.data?.monthly_limit != null && quota.data.used >= quota.data.monthly_limit;
  const canceled = sub?.status === "canceled";
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <DataState loading={(plan.loading && !sub) || (quota.loading && !quota.data)} error={quota.error} onRetry={quota.reload}>
        <SettingsBlock
          title={isPremium ? "Tu plan: Premium" : "Tu plan: Gratis"}
          hint={
            isPremium && sub
              ? canceled
                ? `No se renovará. Tienes Premium hasta el ${shortDate(sub.current_period_end)}.`
                : `Se renueva el ${shortDate(sub.current_period_end)}.`
              : "Caja, ventas, compras, inventario y tu equipo, gratis y sin fecha de vencimiento."
          }
          // The title already names the plan: the badge says how it stands (as on the plans page).
          action={isPremium && <Badge tone={canceled ? "warning" : "success"}>{canceled ? "Renovación cancelada" : "Activo"}</Badge>}
        >
          {quota.data && <QuotaMeter quota={quota.data} />}
          {!isPremium && premium && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
              <p className="max-w-lg text-sm text-text-secondary">
                {out
                  ? `Para lanzar otra predicción antes de fin de mes, Premium quita el tope por ${soles(premium.price_monthly)} al mes.`
                  : `Premium quita el tope${limit ? ` de ${limit} predicciones` : ""} por ${soles(premium.price_monthly)} al mes. Lo demás es igual en los dos planes.`}
              </p>
              <Link href="/premium" className="btn btn-primary h-11 gap-2 px-4 text-sm">
                Ver Premium <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          )}
          {isPremium && (
            <div>
              <Link href="/premium" className="btn btn-secondary h-11 gap-2 px-4 text-sm">
                Gestionar plan <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          )}
          {plans.error && <p className="text-sm text-text-muted">No pudimos leer los precios: {plans.error}</p>}
        </SettingsBlock>
      </DataState>

      {isPremium && (
        <SettingsBlock
          title="Cómo predice bria."
          hint="El recorrido de siete pasos, para repasarlo cuando quieras."
          action={
            <Button variant="secondary" onClick={() => setTourOpen(true)}>
              Ver el recorrido
            </Button>
          }
        />
      )}
      <PredictionTourModal open={tourOpen} onClose={() => setTourOpen(false)} />

      {payments.data && payments.data.length > 0 && (
        <SettingsBlock title="Pagos" hint="Cada pago queda con su referencia.">
          <PaymentsTable payments={payments.data} />
        </SettingsBlock>
      )}
    </div>
  );
}
