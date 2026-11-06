"use client";

import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SelectOption } from "@/components/ui/Select";
import type { ComputedLine, Line } from "./lines";
import { PurchaseLineRow } from "./PurchaseLineRow";
import type { SupplierSuggestions } from "./useSupplierSuggestions";

interface Props {
  computed: ComputedLine[];
  optionsFor: (productId: string) => SelectOption[];
  showErrors: boolean;
  includeIgv: boolean;
  supplierName: string | null;
  suggestions: SupplierSuggestions;
  /** Products of the catalog that can still be added (not already in a line). */
  canAdd: (productId: string) => boolean;
  onPick: (uid: string, productId: string) => void;
  onChange: (uid: string, patch: Partial<Line>) => void;
  onRemove: (uid: string) => void;
  onAdd: (mode: Line["mode"]) => void;
  onAddProduct: (productId: string) => void;
  onFillSuggested: () => void;
}

const USUAL_LIMIT = 8;

/** The products of the purchase, with shortcuts to what this supplier usually sells you. */
export function PurchaseLinesCard(props: Props) {
  const { computed, suggestions, supplierName, canAdd } = props;
  const usual = suggestions.usual.filter((p) => canAdd(p.product_id)).slice(0, USUAL_LIMIT);
  const suggestedCount = [...suggestions.suggested.keys()].filter((id) => canAdd(id) || computed.some((c) => c.line.productId === id)).length;

  return (
    <section aria-labelledby="purchase-lines-title" className="@container overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="purchase-lines-title" className="text-[15px] font-semibold text-text-primary">
            ¿Qué productos te trajo?
          </h2>
          <p className="text-[13px] text-text-muted">Cuántos llegaron y cuánto te costó cada uno ({props.includeIgv ? "con IGV" : "sin IGV"}).</p>
        </div>
        {suggestedCount > 0 && (
          <Button variant="secondary" size="sm" onClick={props.onFillSuggested} className="self-start bg-primary-soft text-accent-text sm:self-auto">
            <Sparkles aria-hidden className="h-3.5 w-3.5" /> Llenar con lo sugerido ({suggestedCount})
          </Button>
        )}
      </div>

      {usual.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
          <span className="text-[12px] font-semibold text-text-muted">Le sueles comprar a {supplierName}:</span>
          {usual.map((p) => (
            <button
              key={p.product_id}
              type="button"
              onClick={() => props.onAddProduct(p.product_id)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-[12.5px] font-semibold text-text-primary transition-colors hover:border-text-muted/50 hover:bg-surface-soft"
            >
              <Plus aria-hidden className="h-3 w-3" /> {p.name}
            </button>
          ))}
        </div>
      )}

      {/* From the @2xl container width (~672 px) it is a table; below, each line is a stacked card (see PurchaseLineRow). */}
      <div className="relative overflow-x-auto">
        <table className="block w-full text-left text-sm @2xl:table">
          <thead className="hidden bg-surface-soft @2xl:table-header-group">
            <tr className="text-[12px] font-semibold text-text-muted">
              <th scope="col" className="px-4 py-2.5">Producto</th>
              <th scope="col" className="px-3 py-2.5 text-center">Cantidad</th>
              <th scope="col" className="px-3 py-2.5 text-right">Costo c/u</th>
              <th scope="col" className="px-3 py-2.5 text-right">Subtotal</th>
              <th scope="col" className="px-2 py-2.5">
                <span className="sr-only">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody className="block @2xl:table-row-group">
            {computed.map((c, i) => (
              <PurchaseLineRow
                key={c.line.uid}
                c={c}
                index={i}
                options={props.optionsFor(c.line.productId)}
                showErrors={props.showErrors}
                includeIgv={props.includeIgv}
                suggested={c.line.productId ? suggestions.suggested.get(c.line.productId) : undefined}
                onPick={(id) => props.onPick(c.line.uid, id)}
                onChange={(patch) => props.onChange(c.line.uid, patch)}
                onRemove={() => props.onRemove(c.line.uid)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
        <Button variant="secondary" size="sm" onClick={() => props.onAdd("existing")}>
          <Plus aria-hidden className="h-3.5 w-3.5" /> Agregar producto
        </Button>
        <Button variant="ghost" size="sm" onClick={() => props.onAdd("new")}>
          <Plus aria-hidden className="h-3.5 w-3.5" /> Producto nuevo
        </Button>
      </div>
    </section>
  );
}
