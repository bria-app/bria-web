import { cn } from "@/lib/utils";

/** Shared input look (same as TextField and Select), so every form reads as one design. */
export function inputClass(error?: string | boolean, extra?: string): string {
  return cn(
    "w-full h-11 rounded-xl border bg-surface px-3.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-4",
    error
      ? "border-danger focus:ring-danger/15"
      : "border-border hover:border-text-muted/50 focus:border-accent-text focus:ring-primary/20",
    "disabled:cursor-not-allowed disabled:opacity-60",
    extra,
  );
}
