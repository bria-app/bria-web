"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./Select";

interface SelectOptionListProps<V extends string> {
  options: SelectOption<V>[];
  value: V | "" | null | undefined;
  /** Index of the keyboard-highlighted option. */
  active: number;
  onHover: (index: number) => void;
  onChoose: (option: SelectOption<V>) => void;
  emptyText: string;
  maxHeight: number;
}

/** The scrolling list inside the `Select` panel: group headers, tree indentation and the check. */
export function SelectOptionList<V extends string>({
  options,
  value,
  active,
  onHover,
  onChoose,
  emptyText,
  maxHeight,
}: SelectOptionListProps<V>) {
  return (
    <div role="listbox" className="overflow-y-auto p-1.5" style={{ maxHeight }}>
      {options.length === 0 && <p className="px-3 py-6 text-center text-sm text-text-muted">{emptyText}</p>}
      {options.map((opt, i) => {
        const isSelected = opt.value === value;
        const showGroup = opt.group && opt.group !== options[i - 1]?.group;
        return (
          <div key={`${opt.value}-${i}`}>
            {showGroup && (
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{opt.group}</p>
            )}
            <button
              type="button"
              data-index={i}
              role="option"
              aria-selected={isSelected}
              disabled={opt.disabled}
              onMouseEnter={() => onHover(i)}
              onClick={() => onChoose(opt)}
              style={{ paddingLeft: 12 + (opt.depth ?? 0) * 16 }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl py-2 pr-3 text-left text-sm transition-colors",
                i === active && !isSelected && "bg-surface-soft",
                isSelected ? "bg-primary-soft text-accent-text" : "text-text-primary",
                opt.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {(opt.depth ?? 0) > 0 && <span className="h-px w-2.5 shrink-0 bg-border" />}
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate", isSelected && "font-semibold")}>{opt.label}</span>
                {opt.description && <span className="block truncate text-[11px] text-text-muted">{opt.description}</span>}
              </span>
              {isSelected && <Check className="h-4 w-4 shrink-0" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
