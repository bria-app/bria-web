"use client";

import { useEffect, useState } from "react";
import { ShopIcon, type ShopIconName } from "@/components/brand/ShopIcons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { soles } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Item {
  icon: ShopIconName;
  name: string;
  price: number;
}

/** Illustration only: the kinds of things MYPEs sell, with everyday prices. */
const ROWS: Item[][] = [
  [
    { icon: "polo", name: "Polo básico", price: 25 },
    { icon: "zapatilla", name: "Zapatilla urbana", price: 119.9 },
    { icon: "bolsa", name: "Bolsa ecológica", price: 3.5 },
    { icon: "perfume", name: "Colonia 100 ml", price: 59 },
    { icon: "celular", name: "Funda de celular", price: 18 },
    { icon: "lapiz", name: "Lápiz 2B", price: 1.5 },
  ],
  [
    { icon: "gaseosa", name: "Gaseosa 1.5 L", price: 7.5 },
    { icon: "pan", name: "Pan de molde", price: 9.8 },
    { icon: "manzana", name: "Manzana x kg", price: 6.9 },
    { icon: "pastillas", name: "Paracetamol x 10", price: 4.5 },
    { icon: "pata", name: "Croquetas 3 kg", price: 45.9 },
    { icon: "balanza", name: "Arroz x kg", price: 4.2 },
  ],
  [
    { icon: "martillo", name: "Martillo de uña", price: 32 },
    { icon: "pintura", name: "Pintura 1 gl", price: 54.9 },
    { icon: "caja", name: "Caja de clavos", price: 12 },
    { icon: "boleta", name: "Talonario", price: 8 },
    { icon: "polo", name: "Polo cuello V", price: 29.9 },
    { icon: "zapatilla", name: "Zapatilla niño", price: 79 },
  ],
];

const SALE: Item[] = [ROWS[0][0], ROWS[1][0], ROWS[2][1], ROWS[1][4]];
const LINE_MS = 1500;
const HOLD_MS = 2600;

function Tile({ item }: { item: Item }) {
  return (
    <li className="flex w-[148px] shrink-0 flex-col gap-3 rounded-2xl border border-strong-foreground/10 bg-strong-foreground/[0.04] p-3.5">
      <ShopIcon name={item.icon} accentClassName="stroke-accent-on-strong" className="h-9 w-9 text-strong-foreground/85" />
      <span className="flex flex-col gap-0.5">
        <span className="truncate text-[12.5px] font-medium text-strong-foreground/80">{item.name}</span>
        <span className="font-mono text-[12px] text-strong-foreground/50">{soles(item.price)}</span>
      </span>
    </li>
  );
}

/** One endless shelf row: the list twice, slid by half its width, so the loop has no seam. */
function Shelf({ items, reverse, seconds, still }: { items: Item[]; reverse?: boolean; seconds: number; still: boolean }) {
  return (
    <div className="overflow-hidden">
      <ul
        className={cn("flex w-max gap-3", !still && "shelf-run")}
        style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {[...items, ...items].map((item, i) => (
          <Tile key={`${item.name}-${i}`} item={item} />
        ))}
      </ul>
    </div>
  );
}

/** A boleta that rings up a few products, one line at a time, then starts again. */
function LiveReceipt({ still }: { still: boolean }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (still) return;
    const id = window.setTimeout(() => setCount((n) => (n >= SALE.length ? 1 : n + 1)), count >= SALE.length ? HOLD_MS : LINE_MS);
    return () => window.clearTimeout(id);
  }, [count, still]);

  const shown = still ? SALE : SALE.slice(0, count);
  const total = shown.reduce((sum, i) => sum + i.price, 0);

  return (
    <div aria-hidden className="w-[260px] rounded-2xl bg-surface p-4 font-mono text-[11.5px] text-text-primary shadow-soft-xl">
      <div className="flex items-center justify-between border-b border-dashed border-border pb-2.5">
        <span className="font-display text-[13px] font-bold">Tu tienda</span>
        <span className="text-text-muted">Boleta</span>
      </div>
      <ul className="flex min-h-[112px] flex-col gap-1.5 py-2.5">
        {shown.map((item) => (
          <li key={item.name} className="ticket-line flex items-center gap-2">
            <ShopIcon name={item.icon} className="h-4 w-4 shrink-0 text-text-secondary" />
            <span className="min-w-0 flex-1 truncate font-sans text-[12px]">{item.name}</span>
            <span>{soles(item.price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2.5">
        <span className="font-sans text-[12px] font-semibold">Total</span>
        <span key={total} className="ticket-total text-[15px] font-semibold">
          {soles(total)}
        </span>
      </div>
    </div>
  );
}

/** Scene «vitrina»: shelves sliding by and a sale being rung up. */
export function ShelfScene() {
  const still = useReducedMotion();

  return (
    <div className="relative -mx-12">
      <div className="shelf-fade flex flex-col gap-3">
        <Shelf items={ROWS[0]} seconds={46} still={still} />
        <Shelf items={ROWS[1]} seconds={58} reverse still={still} />
        <Shelf items={ROWS[2]} seconds={52} still={still} />
      </div>
      <div className="absolute -bottom-10 right-16 rotate-[-2deg]">
        <LiveReceipt still={still} />
        <span className="ticket-chip absolute -left-24 -top-6 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-sans text-[12px] font-semibold text-on-primary shadow-soft-lg">
          bria: quedan 3 polos · pide 12 más
        </span>
      </div>
    </div>
  );
}
