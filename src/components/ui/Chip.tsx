"use client";

import { cn } from "@/lib/utils";

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Optional count shown faded after the label. */
  count?: number;
  /** For a chip that opens a panel: whether it is open. */
  expanded?: boolean;
}

/** Filter chip: selected chips are solid ink, the rest outlined. */
export function Chip({ active, onClick, children, count, expanded }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-expanded={expanded}
      aria-haspopup={expanded === undefined ? undefined : "dialog"}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        active ? "border-strong bg-strong text-strong-foreground" : "border-border bg-surface text-text-primary hover:border-text-muted/50",
      )}
    >
      {children}
      {count !== undefined && <span className="font-medium opacity-60">{count}</span>}
    </button>
  );
}
