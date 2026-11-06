import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { shortDate, soles } from "@/lib/format";
import type { BillingCycle, PlanDTO } from "@/types/billing";
import { igvBreakdown, priceFor } from "./plan-data";

interface CheckoutSummaryProps {
  premium: PlanDTO;
  cycle: BillingCycle;
  onCycle: (c: BillingCycle) => void;
  /** When the paid period would end. */
  until: Date;
  /** Paying while already premium extends the current period. */
  extending: boolean;
  sending: boolean;
  disabled: boolean;
}

/** Order summary with the IGV split and the single action of the checkout. */
export function CheckoutSummary({ premium, cycle, onCycle, until, extending, sending, disabled }: CheckoutSummaryProps) {
  const total = priceFor(premium, cycle);
  const { base, igv } = igvBreakdown(total);

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-6 lg:self-start">
      <div>
        <p className="font-display text-lg font-bold text-text-primary">Plan {premium.name}</p>
        <p className="text-sm text-text-secondary">{premium.tagline}</p>
      </div>
      <Segmented<BillingCycle>
        label="Cada cuánto pagas"
        value={cycle}
        options={[
          { value: "monthly", label: "Mensual" },
          { value: "yearly", label: "Anual" },
        ]}
        onChange={onCycle}
        className="self-start"
      />
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-text-secondary"><dt>Valor de venta</dt><dd className="font-mono">{soles(base)}</dd></div>
        <div className="flex justify-between text-text-secondary"><dt>IGV (18 %)</dt><dd className="font-mono">{soles(igv)}</dd></div>
        {cycle === "yearly" && premium.yearly_savings > 0 && (
          <div className="flex justify-between text-success"><dt>Ahorro frente a 12 meses</dt><dd className="font-mono">{soles(premium.yearly_savings)}</dd></div>
        )}
        <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold text-text-primary">Total</dt>
          <dd className="font-mono text-2xl font-bold text-text-primary">{soles(total)}</dd>
        </div>
      </dl>
      <p className="text-[13px] text-text-secondary">
        {extending ? "Se suma a tu periodo actual: Premium llega" : "Premium queda activo"} hasta el {shortDate(until)} y se renueva solo. Cancelas cuando quieras.
      </p>
      <Button type="submit" form="checkout-form" size="lg" loading={sending} disabled={disabled}>
        {extending ? "Pagar" : "Activar Premium"} · {soles(total)}
      </Button>
      <p className="text-[12.5px] leading-snug text-text-muted">Pago de demostración: no se cobra nada.</p>
    </aside>
  );
}
