import { cn } from "@/lib/utils";

interface TouchChoiceProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** "radio" inside a radiogroup, "toggle" for stand-alone pressed buttons. */
  role?: "radio" | "toggle";
  mono?: boolean;
  className?: string;
}

/**
 * Till-sized choice (44 px tall) for tablets: payment method, comprobante, discount presets.
 * Selected options are solid ink, like `Chip`. Candidate for promotion to `components/ui`.
 */
export function TouchChoice({ active, onClick, children, role = "radio", mono, className }: TouchChoiceProps) {
  return (
    <button
      type="button"
      role={role === "radio" ? "radio" : undefined}
      aria-checked={role === "radio" ? active : undefined}
      aria-pressed={role === "toggle" ? active : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border px-3 text-[13px] font-semibold transition-colors",
        active ? "border-strong bg-strong text-strong-foreground" : "border-border bg-surface text-text-primary hover:border-text-muted/50",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </button>
  );
}
