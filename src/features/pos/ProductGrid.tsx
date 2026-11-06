"use client";

import { cn } from "@/lib/utils";
import { soles, units } from "@/lib/format";
import type { CatalogProduct } from "@/types/pos";
import { stockTone } from "./StockBadge";

const TONE_TEXT = { out: "text-danger", low: "text-warning", ok: "text-text-muted" } as const;

interface ProductGridProps {
  products: CatalogProduct[];
  /** Units of each product already in the sale. */
  quantities: ReadonlyMap<string, number>;
  onAdd: (product: CatalogProduct) => void;
}

/** Tap a card to add one unit. The count shown is what is left after the current sale. */
export function ProductGrid({ products, quantities, onAdd }: ProductGridProps) {
  // 150 px columns keep two cards side by side on a 375 px phone.
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
      {products.map((p) => {
        const qty = quantities.get(p.id) ?? 0;
        const left = p.stock_on_hand - qty;
        const out = p.stock_on_hand <= 0;
        const leftLabel = out ? "Agotado" : left > 0 ? `Quedan ${units(left)}` : "No quedan más";
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onAdd(p)}
              aria-label={`Agregar ${p.name}, ${soles(p.unit_price)}, ${leftLabel.toLowerCase()}`}
              className={cn(
                "relative flex h-full min-h-[112px] w-full flex-col gap-1 rounded-2xl border bg-surface p-3.5 text-left transition-colors",
                qty > 0 ? "border-primary ring-4 ring-primary/15" : "border-border hover:border-text-muted/50",
                out && "opacity-60",
              )}
            >
              {qty > 0 && (
                <span className="absolute right-2.5 top-2.5 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 font-mono text-[12px] font-bold text-on-primary">
                  {qty}
                </span>
              )}
              <span className="truncate pr-8 font-mono text-[11px] text-text-muted">{p.sku}</span>
              <span className="line-clamp-2 pr-6 text-[14px] font-semibold leading-snug text-text-primary">{p.name}</span>
              {/* The price never splits; the stock note drops below it when the card is narrow. */}
              <span className="mt-auto flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 pt-1">
                <span className="whitespace-nowrap font-mono text-[16px] text-text-primary">{soles(p.unit_price)}</span>
                <span className={cn("shrink-0 text-[11.5px] font-medium", TONE_TEXT[stockTone(left, p.reorder_point)])}>{leftLabel}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
