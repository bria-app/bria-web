import { Check } from "lucide-react";
import { soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlanDTO } from "@/types/billing";
import { sharedFeatures } from "./plan-data";

interface PlanCompareProps {
  free: PlanDTO;
  premium: PlanDTO;
  /** Free predictions per month; null when unknown. */
  freeLimit: number | null;
  /** Which column is the company's plan today. */
  current: "free" | "premium";
}

/** Check plus «Incluido»; in a narrow box only the check shows (the word stays for screen readers). */
function Included() {
  return (
    <span className="inline-flex items-center gap-1.5 text-success">
      <Check aria-hidden className="h-4 w-4 shrink-0" /> <span className="sr-only text-[13px] font-semibold @sm:not-sr-only">Incluido</span>
    </span>
  );
}

/**
 * Free vs Premium, row by row. Only the prediction limit is enforced by plan in the system
 * today, so it is the one row that differs; everything else is the same in both plans.
 */
export function PlanCompare({ free, premium, freeLimit, current }: PlanCompareProps) {
  const head = (plan: PlanDTO, id: "free" | "premium") => (
    <th scope="col" className={cn("w-[28%] px-3 @md:px-4 py-3 text-left align-bottom", id === "premium" && "bg-primary-soft")}>
      <span className="block font-display text-base font-bold text-text-primary">{plan.name}</span>
      <span className="block font-mono text-[13px] font-medium text-text-secondary">
        {plan.price_monthly === 0 ? "S/ 0" : `${soles(plan.price_monthly)} al mes`}
      </span>
      {current === id && <span className="mt-1 block text-[11px] font-bold text-accent-text">Tu plan</span>}
    </th>
  );

  return (
    <div className="@container relative overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Comparación entre el plan {free.name} y el plan {premium.name}</caption>
        <thead className="bg-surface-soft">
          <tr>
            <th scope="col" className="px-3 @md:px-4 py-3 text-left text-[12px] font-semibold text-text-muted">Qué incluye</th>
            {head(free, "free")}
            {head(premium, "premium")}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <th scope="row" className="px-3 @md:px-4 py-4 text-left font-semibold text-text-primary">
              Predicciones con IA al mes
              <span className="block text-[12.5px] font-normal text-text-muted">Cada predicción puede cubrir todo tu inventario.</span>
            </th>
            <td className="px-3 @md:px-4 py-4 font-mono font-semibold text-text-primary">{freeLimit ?? "Con límite"}</td>
            <td className="bg-primary-soft px-3 @md:px-4 py-4 font-semibold text-text-primary">Sin límite</td>
          </tr>
          {sharedFeatures(free).map((f) => (
            <tr key={f} className="border-t border-border">
              <th scope="row" className="px-3 @md:px-4 py-3 text-left font-medium text-text-secondary">{f}</th>
              <td className="px-3 @md:px-4 py-3"><Included /></td>
              <td className="bg-primary-soft px-3 @md:px-4 py-3"><Included /></td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <th scope="row" className="px-3 @md:px-4 py-3 text-left font-medium text-text-secondary">
              Pronóstico por categoría, proveedor o producto, seguimiento y sugerencias de compra
            </th>
            <td className="px-3 @md:px-4 py-3"><Included /></td>
            <td className="bg-primary-soft px-3 @md:px-4 py-3"><Included /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
