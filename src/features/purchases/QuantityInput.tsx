"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name, e.g. «Cantidad de Arroz 5 kg». */
  label: string;
  invalid?: boolean;
}

/** Whole-unit quantity: type it, or nudge it with − and +. */
export function QuantityInput({ value, onChange, label, invalid }: Props) {
  const n = Number(value);
  const current = Number.isFinite(n) ? Math.trunc(n) : 0;
  const step = (delta: number) => onChange(String(Math.max(1, current + delta)));
  const nudge = "grid h-11 w-9 shrink-0 place-items-center text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary disabled:opacity-40";

  return (
    <div
      className={cn(
        "flex h-11 items-center overflow-hidden rounded-xl border bg-surface focus-within:ring-4",
        invalid ? "border-danger focus-within:ring-danger/15" : "border-border focus-within:border-accent-text focus-within:ring-primary/20",
      )}
    >
      <button type="button" className={nudge} onClick={() => step(-1)} disabled={current <= 1} aria-label={`Menos: ${label}`}>
        <Minus aria-hidden className="h-3.5 w-3.5" />
      </button>
      <input
        aria-label={label}
        aria-invalid={invalid || undefined}
        inputMode="numeric"
        className="h-full w-full min-w-0 bg-transparent text-center font-mono text-sm text-text-primary outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" className={nudge} onClick={() => step(1)} aria-label={`Más: ${label}`}>
        <Plus aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
