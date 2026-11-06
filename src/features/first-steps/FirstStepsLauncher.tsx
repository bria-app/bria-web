"use client";

import { ChevronRight } from "lucide-react";
import { useFirstSteps } from "./FirstStepsProvider";
import { ProgressRing } from "./ProgressRing";

type Variant = "sidebar" | "rail" | "topbar";

/** Opens the «Primeros pasos» panel; shows progress and what comes next. Hidden once all is done. */
export function FirstStepsLauncher({ variant, onOpen }: { variant: Variant; onOpen?: () => void }) {
  const { available, steps, doneCount, next, setOpen } = useFirstSteps();
  if (!available) return null;

  const total = steps.length;
  const label = `Primeros pasos: ${doneCount} de ${total} listos${next ? `. Sigue: ${next.title}` : ""}`;
  const open = () => {
    onOpen?.();
    setOpen(true);
  };

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={label}
        title={label}
        className="mx-auto grid h-11 w-11 place-items-center rounded-xl hover:bg-surface-muted"
      >
        <ProgressRing done={doneCount} total={total} size={34} label />
      </button>
    );
  }

  if (variant === "topbar") {
    return (
      <button
        type="button"
        onClick={open}
        aria-label={label}
        title={label}
        className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface pl-1.5 pr-3 text-[13px] font-semibold text-text-primary hover:border-text-muted/40"
      >
        <ProgressRing done={doneCount} total={total} size={28} />
        <span className="hidden sm:inline">Primeros pasos</span>
        <span className="font-mono text-text-muted">
          {doneCount}/{total}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={label}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-2.5 pr-3 text-left transition-colors hover:border-text-muted/40"
    >
      <ProgressRing done={doneCount} total={total} size={40} label />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-text-primary">Primeros pasos</span>
        <span className="block truncate text-[12px] text-text-muted">{next ? `Sigue: ${next.title}` : "Todo listo"}</span>
      </span>
      <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
