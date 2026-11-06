"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; also shown when `showLabel`. */
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
}

/** On/off toggle with role="switch". */
export function Switch({ checked, onChange, label, showLabel = false, disabled }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2.5", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-1 top-1 h-5 w-5 rounded-full shadow-sm transition-transform duration-150",
            checked ? "translate-x-5 bg-on-primary" : "bg-surface",
          )}
        />
      </button>
      {showLabel && <span className="text-sm">{label}</span>}
    </label>
  );
}
