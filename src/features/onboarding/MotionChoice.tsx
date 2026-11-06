"use client";

import { useEffect, useId, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MotionRow } from "./motionChoices";

interface MotionChoiceProps<T extends string> {
  row: MotionRow<T>;
  value: T;
  onChange: (value: T) => void;
  /** The person points at, focuses or picks an option: the preview acts it out. */
  onPreview: (value: T) => void;
}

/** Hovering only counts once the pointer rests a moment, so crossing the row plays nothing. */
const HOVER_DELAY = 160;

/**
 * A movement preference as two tiles (a radio group) with a picture each, and one line under them
 * that says what the chosen option does.
 */
export function MotionChoice<T extends string>({ row, value, onChange, onPreview }: MotionChoiceProps<T>) {
  const id = useId();
  const hover = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(hover.current), []);
  const chosen = row.options.find((o) => o.value === value) ?? row.options[0];

  // ← → move the choice and the focus, as in `Segmented`.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const i = row.options.findIndex((o) => o.value === value);
    const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
    const next = (i + (forward ? 1 : -1) + row.options.length) % row.options.length;
    e.preventDefault();
    onChange(row.options[next].value);
    onPreview(row.options[next].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p id={`${id}-label`} className="text-[14px] font-semibold text-text-primary">
          {row.label}
        </p>
        <p className="text-[12.5px] text-text-muted">{row.hint}</p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-text`}
        onKeyDown={onKeyDown}
        onPointerLeave={() => window.clearTimeout(hover.current)}
        className="grid grid-cols-2 gap-2"
      >
        {row.options.map((o) => {
          const on = o.value === value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onClick={() => {
                onChange(o.value);
                onPreview(o.value);
              }}
              onFocus={() => onPreview(o.value)}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                window.clearTimeout(hover.current);
                hover.current = window.setTimeout(() => onPreview(o.value), HOVER_DELAY);
              }}
              className={cn(
                "flex min-h-[52px] min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                on ? "border-strong bg-surface-soft" : "border-border bg-surface hover:border-text-muted/60",
              )}
            >
              <span
                aria-hidden
                className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", on ? "bg-strong text-strong-foreground" : "bg-surface-muted text-text-secondary")}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-text-primary">{o.label}</span>
              <span
                aria-hidden
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  on ? "border-strong bg-strong text-strong-foreground" : "border-border",
                )}
              >
                {on && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <p id={`${id}-text`} className="text-[12.5px] leading-snug text-text-secondary">
        {chosen.text}
      </p>
    </div>
  );
}
