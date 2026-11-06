import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BillingCycle, PlanDTO } from "@/types/billing";
import type { FtgmQuota } from "@/types/forecasting";
import { PriceTag } from "./PriceTag";
import { QuotaMeter } from "./QuotaMeter";

interface UpgradeCardProps {
  premium: PlanDTO;
  quota: FtgmQuota | null;
  freeLimit: number | null;
  canBuy: boolean;
  cycle: BillingCycle;
  onCycle: (c: BillingCycle) => void;
}

/** The offer, told with the company's own month: how many predictions it used and what Premium costs. */
export function UpgradeCard({ premium, quota, freeLimit, canBuy, cycle, onCycle }: UpgradeCardProps) {
  const out = quota !== null && quota.monthly_limit !== null && quota.used >= quota.monthly_limit;

  return (
    <section className="grid gap-6 rounded-3xl border border-border bg-surface p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-text-primary sm:text-[28px]">
          {out ? "Te quedaste sin predicciones este mes" : "Predice cada vez que lo necesites"}
        </h2>
        <p className="max-w-xl text-[15px] leading-relaxed text-text-secondary">
          {freeLimit
            ? `El plan Gratis trae ${freeLimit} predicciones con IA al mes. Premium quita ese tope: recalculas cuando llega mercadería, cambia la temporada o pruebas otro grupo de productos.`
            : "Premium quita el tope mensual de predicciones con IA: recalculas cuando llega mercadería, cambia la temporada o pruebas otro grupo de productos."}
        </p>
        {quota && <QuotaMeter quota={quota} />}
        <p className="text-[13px] text-text-muted">Lo demás es igual en los dos planes: caja, ventas, compras, inventario y tu equipo.</p>
      </div>

      <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-surface-soft p-4 sm:p-5">
        <div>
          <p className="font-display text-lg font-bold text-text-primary">{premium.name}</p>
          <p className="text-sm text-text-secondary">{premium.tagline}</p>
        </div>
        <PriceTag premium={premium} cycle={cycle} onCycle={onCycle} />
        {canBuy ? (
          <Link href={`/premium/checkout?cycle=${cycle}`} className="btn btn-primary h-12 gap-2 px-6 text-[15px]">
            Activar Premium <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        ) : (
          <p className="rounded-xl bg-surface px-4 py-3 text-sm text-text-secondary">Solo el dueño o un administrador puede activar Premium.</p>
        )}
        <p className="text-[12.5px] leading-snug text-text-muted">
          Pago de demostración: en esta versión de bria no se cobra nada. Cancelas cuando quieras.
        </p>
      </div>
    </section>
  );
}
