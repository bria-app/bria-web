import { Segmented } from "@/components/ui/Segmented";
import { soles } from "@/lib/format";
import type { BillingCycle, PlanDTO } from "@/types/billing";
import { priceFor } from "./plan-data";

interface PriceTagProps {
  premium: PlanDTO;
  cycle: BillingCycle;
  onCycle: (c: BillingCycle) => void;
}

/** Premium's price for the chosen cycle, straight from the catalog, with the yearly saving. */
export function PriceTag({ premium, cycle, onCycle }: PriceTagProps) {
  const price = priceFor(premium, cycle);
  const perMonth = cycle === "yearly" ? premium.price_yearly / 12 : premium.price_monthly;
  const perDay = premium.price_monthly / 30;
  const fullYear = premium.price_monthly * 12;
  const savingsPct = premium.yearly_savings > 0 && fullYear > 0 ? Math.round((premium.yearly_savings / fullYear) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <Segmented<BillingCycle>
        label="Cada cuánto pagas"
        value={cycle}
        options={[
          { value: "monthly", label: "Mensual" },
          // Short label: a long one pushes the control out of the card at 375 px.
          { value: "yearly", label: savingsPct > 0 ? `Anual · ${savingsPct} % menos` : "Anual" },
        ]}
        onChange={onCycle}
        className="self-start"
      />
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-mono text-[32px] font-bold tracking-[-0.03em] sm:text-4xl text-text-primary">{soles(price)}</span>
        <span className="text-sm text-text-muted">al {cycle === "yearly" ? "año" : "mes"}</span>
      </p>
      <p className="text-[13px] text-text-secondary">
        {cycle === "yearly"
          ? `Sale a ${soles(perMonth)} al mes${premium.yearly_savings > 0 ? ` y ahorras ${soles(premium.yearly_savings)}` : ""}. IGV incluido.`
          : `Unos ${soles(perDay)} al día. IGV incluido, sin permanencia.`}
      </p>
    </div>
  );
}
