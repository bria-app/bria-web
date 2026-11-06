"use client";

import { useEffect, useState } from "react";
import { ShopIcon, type ShopIconName } from "@/components/brand/ShopIcons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { soles, units } from "@/lib/format";

interface Product {
  icon: ShopIconName;
  name: string;
  code: string;
  price: number;
  /** Units on the shelf before this scan. */
  left: number;
}

/** Illustration only: a till scanning everyday products. */
const BELT: Product[] = [
  { icon: "gaseosa", name: "Gaseosa 1.5 L", code: "7751271001234", price: 7.5, left: 24 },
  { icon: "polo", name: "Polo básico M", code: "7759012345678", price: 25, left: 9 },
  { icon: "pastillas", name: "Paracetamol x 10", code: "7750182003456", price: 4.5, left: 40 },
  { icon: "martillo", name: "Martillo de uña", code: "7752003004567", price: 32, left: 6 },
  { icon: "pan", name: "Pan de molde", code: "7750243007788", price: 9.8, left: 12 },
  { icon: "zapatilla", name: "Zapatilla niño 32", code: "7756001002233", price: 79, left: 4 },
  { icon: "pata", name: "Croquetas 3 kg", code: "7750990001122", price: 45.9, left: 15 },
];

const STEP_MS = 1700;
const TILE = 104; // tile + gap, px
// Tiles kept on each side of the beam. A new tile is created at the outermost slot while the
// previous one is still sliding out of it, so that slot must sit beyond the visible edge.
const SIDE = 6;

/** Scene «caja»: products move under the scanner one by one; each beep rings it up. */
export function ScannerScene() {
  const still = useReducedMotion();
  const [tick, setTick] = useState(1);

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [still]);

  const at = (k: number) => BELT[((k % BELT.length) + BELT.length) % BELT.length];
  const current = at(tick);
  // Products rung up in this round (the sale starts over after a full belt).
  const round = ((tick - 1) % BELT.length) + 1;
  const total = Array.from({ length: round }, (_, i) => at(tick - i).price).reduce((a, b) => a + b, 0);

  return (
    <div aria-hidden className="relative -mx-12 flex flex-col items-center gap-6">
      {/* Belt: each tile is keyed by its absolute position, so moving one step is a transform. */}
      <div className="shelf-fade relative h-[104px] w-full overflow-hidden">
        {Array.from({ length: SIDE * 2 + 1 }, (_, j) => tick - SIDE + j).map((k) => {
          const p = at(k);
          const offset = (k - tick) * TILE;
          return (
            <div
              key={k}
              className="absolute left-1/2 top-1 grid h-[92px] w-[92px] place-items-center rounded-2xl border border-strong-foreground/10 bg-strong-foreground/[0.05] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.65,0,0.25,1)]"
              style={{ transform: `translateX(calc(${offset}px - 50%))` }}
            >
              <ShopIcon name={p.icon} accentClassName="stroke-accent-on-strong" className="h-12 w-12 text-strong-foreground/85" />
            </div>
          );
        })}
        {/* The beam, re-flashing on every scan. */}
        <span key={tick} className="scan-beam pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-primary" />
      </div>

      {/* Read-out of what was just scanned. */}
      <div className="flex w-[360px] max-w-full flex-col gap-3 rounded-2xl bg-surface p-4 text-text-primary shadow-soft-xl">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] font-semibold text-text-muted">
            <span className="h-2 w-2 rounded-full bg-success" /> Escaneado
          </span>
          <span className="font-mono text-[11.5px] text-text-muted">{current.code}</span>
        </div>
        <div key={tick} className="ticket-line flex items-center gap-3">
          <ShopIcon name={current.icon} className="h-8 w-8 shrink-0 text-text-secondary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">{current.name}</span>
            <span className="block text-[12px] text-text-muted">
              Quedan <span className="font-mono">{units(current.left)}</span> → <span className="font-mono text-text-primary">{units(current.left - 1)}</span>
            </span>
          </span>
          <span className="font-mono text-[15px] font-semibold">{soles(current.price)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-border pt-3">
          <span className="text-[12px] font-semibold">
            {round} {round === 1 ? "producto" : "productos"}
          </span>
          <span key={total} className="ticket-total font-mono text-[18px] font-semibold">
            {soles(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
