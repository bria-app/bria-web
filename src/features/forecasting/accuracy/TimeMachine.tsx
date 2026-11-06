"use client";

import { useEffect, useState } from "react";
import { Check, History } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { longDate, shortMonth } from "./score";

const DAY = 86_400_000;
const STEPS = ["Vuelvo a esa fecha", "Calculo sin ver lo que vino después", "Comparo con lo que vendiste"];
export const REWIND_MS = 2200;

const toMs = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** «1 ago», or «1 nov 2025» when the rewind crosses into another year (same month style as `shortDate`). */
const dayLabel = (ms: number, thisYear: number) => {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  return `${d.getUTCDate()} ${shortMonth(d.toISOString().slice(0, 10))}${y !== thisYear ? ` ${y}` : ""}`;
};

/**
 * The test against the past, while it runs: the calendar rewinds from today to the cut-off, the
 * months after it are veiled («bria. no ve esto»), and the three steps advance. `step` comes from
 * the real run (0 rewinding, 1 calculating, 2 comparing).
 */
export function TimeMachine({ today, cutoff, length, step }: { today: string; cutoff: string; length: number; step: number }) {
  const still = useReducedMotion();
  const from = toMs(today);
  const to = toMs(cutoff);
  const [shown, setShown] = useState(still ? to : from);

  useEffect(() => {
    if (still) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / REWIND_MS);
      setShown(from - (from - to) * easeInOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [from, to, still]);

  // The strip: one month before the cut-off, the tested months, and the current one.
  const months = Array.from({ length: length + 2 }, (_, i) => shortMonth(cutoff, i - 1));
  const span = from - (toMs(cutoff) - 31 * DAY);
  const at = (ms: number) => ((ms - (toMs(cutoff) - 31 * DAY)) / span) * 100;
  const head = at(shown);
  const rewound = shown <= to + DAY;

  return (
    <div data-mode="dark" role="status" aria-live="polite" className="tm relative overflow-hidden rounded-[28px] bg-background p-6 text-text-primary sm:p-8">
      <div aria-hidden className="tm-grid pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-text">
            <History aria-hidden className={cn("h-4 w-4", !still && !rewound && "tm-spin")} /> Prueba con tu pasado
          </span>
          <span className="font-mono text-[13px] text-text-muted">hoy es {longDate(today)}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-mono text-[40px] font-medium leading-none tracking-[-0.05em] sm:text-[64px] lg:text-[84px]" aria-label={`Volviendo al ${longDate(cutoff)}`}>
            {dayLabel(shown, Number(today.slice(0, 4)))}
          </span>
          <p className="max-w-xl text-[15px] text-text-secondary">
            Calculo como si hoy fuera el {longDate(cutoff)}. Lo que pasó después lo tapo, y al final lo comparo con lo que de verdad vendiste.
          </p>
        </div>

        {/* The months, the playhead travelling back, and the veil over what bria. must not see. */}
        <div aria-hidden className="relative pt-7">
          <div className="relative h-14 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
              {months.map((m, i) => (
                <span
                  key={m + i}
                  className={cn(
                    "grid place-items-center border-r border-border font-mono last:border-r-0",
                    months.length > 8 ? "text-[10px] sm:text-[12px]" : "text-[13px]",
                    i === 0 ? "text-text-secondary" : "text-text-muted",
                  )}
                >
                  {m}
                </span>
              ))}
            </div>
            <span className="tm-veil absolute inset-y-0 right-0" style={{ left: `${head}%` }} />
          </div>
          <span className="tm-head absolute bottom-0 top-0 w-0" style={{ left: `${head}%` }}>
            <span className="absolute -top-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 font-mono text-[11px] font-semibold text-on-primary">
              {rewound ? "corte" : "hoy"}
            </span>
            <span className="absolute bottom-0 left-1/2 top-6 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
          </span>
          <span
            className={cn("tm-tag absolute -bottom-7 text-[12px] font-medium text-text-muted transition-opacity duration-500", rewound ? "opacity-100" : "opacity-0")}
            // Centred on the playhead, but kept inside the strip (a cut-off near the left edge would clip it).
            style={{ left: `clamp(7.5rem, ${head}%, calc(100% - 7.5rem))` }}
          >
            ← lo que sabía · lo que bria. no ve →
          </span>
        </div>

        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {STEPS.map((s, i) => {
            const done = i < step;
            const here = i === step;
            return (
              <li
                key={s}
                aria-current={here ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] transition-colors duration-500",
                  here ? "border-primary/60 bg-surface text-text-primary" : done ? "border-border text-text-secondary" : "border-border text-text-muted",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
                    done ? "bg-success-soft text-success" : here ? "bg-primary text-on-primary" : "bg-surface-muted",
                  )}
                >
                  {done ? <Check aria-hidden className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                {s}
                {here && <span className="tm-dots ml-auto" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
