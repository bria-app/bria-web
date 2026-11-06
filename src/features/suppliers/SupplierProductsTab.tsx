"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApi } from "@/hooks/useApi";
import { recommendationsApi } from "@/services/api/resources";
import { soles, units } from "@/lib/format";
import type { RecommendationDTO } from "@/types/api";
import type { SuppliedProductDTO } from "@/types/purchasing";
import { dayLabel } from "@/features/purchases/format";
import { cn } from "@/lib/utils";

const TH = "whitespace-nowrap px-3 py-3";

interface Props {
  companyId: string | null;
  products: SuppliedProductDTO[];
}

/** Products bought from this supplier (from its purchase history), with bria's pending suggestions. */
export function SupplierProductsTab({ companyId, products }: Props) {
  const router = useRouter();
  const recs = useApi<RecommendationDTO[]>(() => (companyId ? recommendationsApi.list(companyId, true) : Promise.resolve([])), [companyId]);
  const suggested = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of recs.data ?? []) if (r.status === "pending" && r.recommended_quantity > 0 && !m.has(r.product_id)) m.set(r.product_id, r.recommended_quantity);
    return m;
  }, [recs.data]);
  const anySuggestion = products.some((p) => suggested.has(p.product_id));

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aún no le compras productos"
        description="Aquí verás lo que te vende en cuanto registres su primera compra."
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft">
              <tr className="text-[12px] font-semibold text-text-muted">
                <th scope="col" className={cn(TH, "pl-4 sm:pl-5")}>Producto</th>
                <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Le compraste</th>
                <th scope="col" className={cn(TH, "hidden text-right xl:table-cell")}>Costo promedio</th>
                <th scope="col" className={cn(TH, "hidden text-right lg:table-cell")}>Último costo</th>
                <th scope="col" className={cn(TH, "pr-4 text-right sm:pr-5", anySuggestion && "lg:pr-3")}>Total sin IGV</th>
                {anySuggestion && <th scope="col" className={cn(TH, "hidden pr-5 text-right lg:table-cell")}>bria sugiere</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const s = suggested.get(p.product_id);
                return (
                  <tr key={p.product_id} onClick={() => router.push(`/inventory/${p.product_id}`)} className="h-[52px] cursor-pointer border-t border-border transition-colors hover:bg-surface-soft">
                    <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5">
                      <Link href={`/inventory/${p.product_id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold text-text-primary hover:text-accent-text">
                        {p.name}
                      </Link>
                      <span className="block truncate text-[12.5px] text-text-muted">
                        {p.sku && <span className="font-mono">{p.sku}</span>}
                        <span className="sm:hidden">
                          {p.sku ? " · " : ""}
                          <span className="font-mono">{units(p.total_quantity)}</span>
                        </span>
                        {p.last_cost !== null && (
                          <span className="lg:hidden">
                            {" "}
                            · último <span className="font-mono">{soles(p.last_cost)}</span>
                          </span>
                        )}
                        {s !== undefined && <span className="font-semibold text-accent-text lg:hidden"> · bria sugiere {units(s)}</span>}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono sm:table-cell">{units(p.total_quantity)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-text-secondary xl:table-cell">{soles(p.avg_unit_cost)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right lg:table-cell">
                      <span className="font-mono">{p.last_cost !== null ? soles(p.last_cost) : "—"}</span>
                      <span className="block text-[12px] text-text-muted">{dayLabel(p.last_purchase_date)}</span>
                    </td>
                    <td className={cn("whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono sm:pr-5", anySuggestion && "lg:pr-3")}>{soles(p.total_amount)}</td>
                    {anySuggestion && (
                      <td className="hidden whitespace-nowrap py-2.5 pl-3 pr-5 text-right font-mono lg:table-cell">
                        {s !== undefined ? <span className="font-semibold text-accent-text">{units(s)}</span> : <span className="text-text-muted">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12.5px] text-text-muted">
        Son los productos que le has comprado. Si otro proveedor también te los vende, aparecen en los dos.
      </p>
    </div>
  );
}
