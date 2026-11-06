"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { inputClass } from "@/lib/ui";
import { soles } from "@/lib/format";
import { CartLine, lineGross, lineTotal, moneyInput, percentDiscount, toNumber } from "./cart";
import { TouchChoice } from "./TouchChoice";

const PERCENTS = [0, 5, 10, 15, 20];

interface TicketLineRowProps {
  line: CartLine;
  open: boolean;
  onToggle: () => void;
  onQuantity: (quantity: number) => void;
  onPatch: (patch: Partial<Pick<CartLine, "unitPrice" | "discount">>) => void;
  onRemove: () => void;
}

/** One line of the sale: tap the name to open price and discount; − / + change the quantity. */
export function TicketLineRow({ line, open, onToggle, onQuantity, onPatch, onRemove }: TicketLineRowProps) {
  const p = line.product;
  const discount = toNumber(line.discount);
  const tooMuch = discount > lineGross(line);
  const detailId = `line-${p.id}`;

  return (
    <li className={cn("rounded-xl transition-colors", open && "bg-surface-soft")}>
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={detailId}
          className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left"
        >
          <span className="truncate text-[14px] font-semibold text-text-primary">{p.name}</span>
          <span className={cn("truncate text-[12px]", discount > 0 ? "text-accent-text" : "text-text-muted")}>
            <span className="font-mono">{soles(line.unitPrice)}</span> c/u
            {discount > 0 ? <> · −<span className="font-mono">{soles(discount)}</span></> : " · toca para descuento"}
          </span>
        </button>
        <div className="flex shrink-0 items-center rounded-xl bg-surface-muted p-0.5">
          <button
            type="button"
            onClick={() => onQuantity(line.quantity - 1)}
            aria-label={`Quitar uno de ${p.name}`}
            className="grid h-11 w-11 place-items-center rounded-lg text-text-primary hover:bg-surface"
          >
            <Minus aria-hidden className="h-4 w-4" />
          </button>
          <span className="min-w-7 text-center font-mono text-[15px] text-text-primary">
            {line.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantity(line.quantity + 1)}
            aria-label={`Agregar uno de ${p.name}`}
            className="grid h-11 w-11 place-items-center rounded-lg text-text-primary hover:bg-surface"
          >
            <Plus aria-hidden className="h-4 w-4" />
          </button>
        </div>
        {/* Never wraps: «S/ 1,234.50» is wider than the column a short total needs. */}
        <span className="min-w-[84px] shrink-0 whitespace-nowrap text-right font-mono text-[14px] text-text-primary">{soles(lineTotal(line))}</span>
      </div>

      {open && (
        <div id={detailId} className="flex flex-col gap-3 px-2 pb-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex w-[120px] flex-col gap-1">
              <span className="text-[12px] font-semibold text-text-secondary">Precio c/u</span>
              <input
                value={line.unitPrice}
                inputMode="decimal"
                onChange={(e) => onPatch({ unitPrice: moneyInput(e.target.value) })}
                className={inputClass(false, "text-right font-mono")}
              />
            </label>
            <label className="flex w-[120px] flex-col gap-1">
              <span className="text-[12px] font-semibold text-text-secondary">Descuento S/</span>
              <input
                value={line.discount}
                inputMode="decimal"
                placeholder="0.00"
                aria-invalid={tooMuch || undefined}
                onChange={(e) => onPatch({ discount: moneyInput(e.target.value) })}
                className={inputClass(tooMuch, "text-right font-mono")}
              />
            </label>
            <Button variant="ghost" onClick={onRemove} className="ml-auto text-danger">
              Quitar
            </Button>
          </div>
          <div role="radiogroup" aria-label="Descuento rápido" className="flex flex-wrap gap-1.5">
            {PERCENTS.map((pct) => (
              <TouchChoice
                key={pct}
                active={line.discount === percentDiscount(line, pct)}
                onClick={() => onPatch({ discount: percentDiscount(line, pct) })}
              >
                {pct ? `${pct} %` : "Sin descuento"}
              </TouchChoice>
            ))}
          </div>
          {tooMuch && <p className="text-[12.5px] text-danger">El descuento no puede pasar de {soles(lineGross(line))}.</p>}
        </div>
      )}
    </li>
  );
}
