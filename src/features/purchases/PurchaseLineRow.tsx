"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Select, type SelectOption } from "@/components/ui/Select";
import { formatNumber, percent, soles, units } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { ComputedLine, Line } from "./lines";
import { num } from "./format";
import { QuantityInput } from "./QuantityInput";

interface Props {
  c: ComputedLine;
  index: number;
  options: SelectOption[];
  showErrors: boolean;
  includeIgv: boolean;
  /** Quantity bria suggests for this product, when there is a pending recommendation. */
  suggested?: number;
  onPick: (productId: string) => void;
  onChange: (patch: Partial<Line>) => void;
  onRemove: () => void;
}

/** Shown above each input while the line is a stacked card (the table header is hidden then). */
const CARD_LABEL = "mb-1 block text-[12px] font-semibold text-text-muted @2xl:hidden";

/**
 * One product of the purchase: what it is, how many came and what each one cost.
 * In a narrow card (below the `@2xl` container width) the row turns into a stacked card:
 * product and remove on top, quantity and cost side by side, subtotal at the bottom.
 */
export function PurchaseLineRow({ c, index, options, showErrors, includeIgv, suggested, onPick, onChange, onRemove }: Props) {
  const l = c.line;
  const name = c.product?.name ?? (l.name.trim() || `producto ${index + 1}`);

  return (
    <tr
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-3 gap-y-3 border-t border-border px-4 py-4 align-top @2xl:table-row @2xl:p-0",
        showErrors && !c.valid && "bg-danger-soft/40",
      )}
    >
      <td className="col-span-2 row-start-1 min-w-0 @2xl:px-4 @2xl:py-3">
        {l.mode === "existing" ? (
          <div className="space-y-1.5">
            <Select
              aria-label={`Producto ${index + 1}`}
              value={l.productId}
              onChange={onPick}
              options={options}
              searchable
              placeholder="Busca por nombre o código"
              invalid={showErrors && !c.productOk}
              emptyText="No lo tienes aún: usa «Producto nuevo»"
            />
            {c.product && <ProductHint c={c} suggested={suggested} />}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Producto nuevo</Badge>
              <button type="button" onClick={() => onChange({ mode: "existing" })} className="text-[12px] font-semibold text-text-secondary hover:text-text-primary">
                Elegir uno que ya tengo
              </button>
            </div>
            <input
              aria-label={`Nombre del producto nuevo ${index + 1}`}
              className={inputClass(showErrors && !c.productOk)}
              aria-invalid={showErrors && !c.productOk ? true : undefined}
              placeholder="Nombre del producto"
              value={l.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-2 @sm:grid-cols-3">
              <input aria-label="Código (opcional)" className={inputClass(false, "h-9 font-mono text-[13px]")} placeholder="Código (auto)" value={l.sku} onChange={(e) => onChange({ sku: e.target.value.toUpperCase() })} />
              <input aria-label="Código de barras (opcional)" className={inputClass(false, "h-9 font-mono text-[13px]")} placeholder="Código de barras" value={l.barcode} onChange={(e) => onChange({ barcode: e.target.value })} />
              <input aria-label="Precio de venta (opcional)" inputMode="decimal" className={inputClass(false, "h-9 font-mono text-[13px]")} placeholder="Precio venta" value={l.price} onChange={(e) => onChange({ price: e.target.value.replace(",", ".") })} />
            </div>
          </div>
        )}
      </td>
      <td className="col-start-1 row-start-2 min-w-0 @2xl:w-36 @2xl:px-3 @2xl:py-3">
        <span aria-hidden className={CARD_LABEL}>
          Cantidad
        </span>
        <QuantityInput label={`Cantidad de ${name}`} value={l.quantity} onChange={(quantity) => onChange({ quantity })} invalid={showErrors && !c.qtyOk} />
      </td>
      <td className="col-span-2 col-start-2 row-start-2 min-w-0 @2xl:w-40 @2xl:px-3 @2xl:py-3">
        <span aria-hidden className={CARD_LABEL}>
          Costo c/u
        </span>
        <label className="relative block">
          <span className="sr-only">{`Costo por unidad de ${name}`}</span>
          <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-text-muted">S/</span>
          <input
            inputMode="decimal"
            className={inputClass(showErrors && !c.costOk, "pl-10 text-right font-mono")}
            aria-invalid={showErrors && !c.costOk ? true : undefined}
            placeholder="0.00"
            value={l.unitCost}
            onChange={(e) => onChange({ unitCost: e.target.value.replace(",", ".") })}
          />
        </label>
        {includeIgv && c.costOk && <p className="mt-1 text-right font-mono text-[12px] text-text-muted">sin IGV {soles(c.netCost)}</p>}
      </td>
      <td className="col-span-3 row-start-3 flex items-baseline justify-between gap-3 font-mono font-semibold @2xl:table-cell @2xl:w-32 @2xl:px-3 @2xl:pt-6 @2xl:text-right">
        <span aria-hidden className="font-sans text-[12px] font-semibold text-text-muted @2xl:hidden">
          Subtotal
        </span>
        <span className="whitespace-nowrap">{soles(c.lineTotal)}</span>
      </td>
      <td className="col-start-3 row-start-1 @2xl:w-12 @2xl:px-2 @2xl:pt-3.5">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${name}`}
          title={`Quitar ${name}`}
          className="grid h-11 w-11 place-items-center rounded-lg text-text-muted transition-colors hover:bg-danger-soft hover:text-danger @2xl:h-9 @2xl:w-9"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function ProductHint({ c, suggested }: { c: ComputedLine; suggested?: number }) {
  const p = c.product;
  if (!p) return null;
  const avg = num(p.unit_cost);
  return (
    <p className="px-1 text-[12px] leading-relaxed text-text-muted">
      Tienes <span className="font-mono text-text-secondary">{formatNumber(p.stock_on_hand)}</span>
      {c.qtyOk && (
        <>
          {" "}→ <span className="font-mono font-semibold text-success">{formatNumber(p.stock_on_hand + c.qty)}</span>
        </>
      )}
      {c.newAvg !== null && avg > 0 && Math.abs(c.newAvg - avg) >= 0.005 && (
        <>
          {" "}· costo promedio <span className="font-mono">{soles(avg)}</span> → <span className="font-mono text-text-secondary">{soles(c.newAvg)}</span>
        </>
      )}
      {c.margin !== null && (
        <>
          {" "}· margen <span className={cn("font-mono", c.margin < 0 ? "text-danger" : "text-text-secondary")}>{percent(c.margin)}</span>
        </>
      )}
      {suggested !== undefined && (
        <>
          {" "}· <span className="font-semibold text-accent-text">bria sugiere {units(suggested)}</span>
        </>
      )}
    </p>
  );
}
