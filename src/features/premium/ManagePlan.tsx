"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { billingPlansApi } from "@/services/api/billing";
import { ApiError } from "@/services/api/client";
import { shortDate, toDate } from "@/lib/format";
import type { SubscriptionDTO } from "@/types/api";
import type { FtgmQuota } from "@/types/forecasting";
import { Fact, SettingsBlock } from "@/features/settings/SettingsBlock";

interface ManagePlanProps {
  companyId: string;
  subscription: SubscriptionDTO;
  quota: FtgmQuota | null;
  canManage: boolean;
  onChanged: () => void;
}

/** A company already on Premium: when it renews, and cancel or resume the renewal. */
export function ManagePlan({ companyId, subscription, quota, canManage, onChanged }: ManagePlanProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const canceled = subscription.status === "canceled";
  const end = toDate(subscription.current_period_end);
  const limitBack = canceled && quota?.monthly_limit != null;

  const act = async (call: () => Promise<unknown>, done: string, undo?: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await call();
      onChanged();
      toast(done, undo ? { undo: () => void undo().then(onChanged).catch((e: unknown) => setError(e instanceof Error ? e.message : "No se pudo deshacer. Inténtalo de nuevo.")) } : undefined);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        // The API's reason (e.g. the Premium already ran out) goes in a toast, which outlives
        // this card: the reload may swap it for the plans view.
        toast(e.message);
        onChanged();
      } else {
        setError(e instanceof Error ? e.message : "No se pudo completar. Inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  };

  const cancel = () =>
    act(() => billingPlansApi.cancel(companyId), "Cancelaste la renovación de Premium", () => billingPlansApi.resume(companyId));
  const resume = () => act(() => billingPlansApi.resume(companyId), "Premium vuelve a renovarse solo");

  return (
    <SettingsBlock
      title="Premium"
      hint={canceled ? "No se renovará. Puedes reactivarlo antes de que termine el periodo." : "Se renueva solo al final de cada periodo."}
      action={<Badge tone={canceled ? "warning" : "success"}>{canceled ? "Renovación cancelada" : "Activo"}</Badge>}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <Fact label={canceled ? "Acceso hasta" : "Próxima renovación"}>{shortDate(end)}</Fact>
        <Fact label="Desde">{shortDate(subscription.current_period_start)}</Fact>
        <Fact label="Predicciones este mes" mono>{quota ? `${quota.used}${quota.monthly_limit === null ? " · sin límite" : ` de ${quota.monthly_limit}`}` : "Sin dato"}</Fact>
      </div>
      {limitBack && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          Con la renovación cancelada, el sistema ya vuelve a aplicar el límite de {quota?.monthly_limit} predicciones al mes. Reactívala para seguir sin límite.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/forecasting" className="btn btn-strong h-11 gap-2 px-4 text-sm">Ir a Pronóstico</Link>
        {canManage &&
          (canceled ? (
            end.getTime() > now && <Button variant="secondary" loading={busy} onClick={resume}>Reactivar renovación</Button>
          ) : (
            <Button variant="ghost" loading={busy} onClick={cancel}>Cancelar renovación</Button>
          ))}
      </div>
      {canManage && !canceled && (
        <p className="text-[13px] text-text-muted">
          Si cancelas, tus datos y pronósticos se quedan. Hoy el sistema vuelve a aplicar el límite de predicciones en cuanto cancelas, aunque el periodo pagado siga.
        </p>
      )}
      {!canManage && <p className="text-[13px] text-text-muted">Solo el dueño o un administrador puede cambiar el plan.</p>}
    </SettingsBlock>
  );
}
