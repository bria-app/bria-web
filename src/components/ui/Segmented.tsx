"use client";

import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

/** One-of-many choice shown inline (view modes, periods, document type). */
export function Segmented<T extends string>({ label, value, options, onChange, size = "md", className }: SegmentedProps<T>) {
  // A radio group: Tab lands on the chosen option, ← → move the choice (and the focus) along.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = options.findIndex((o) => o.value === value);
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    e.preventDefault();
    onChange(options[next].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };
  const anyChecked = options.some((o) => o.value === value);

  // Never wider than its container: on a narrow card the options scroll sideways instead of
  // pushing the page wider (the p-1 padding leaves room for the focus ring).
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!anyChecked && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-lg font-semibold transition-colors",
              size === "sm" ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-3 text-[13px]",
              on ? "bg-surface text-text-primary shadow-[0_1px_2px_rgb(var(--shadow-color)/0.08)]" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
