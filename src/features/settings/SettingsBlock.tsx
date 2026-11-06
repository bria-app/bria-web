import { cn } from "@/lib/utils";

interface SettingsBlockProps {
  title: string;
  hint?: string;
  /** Right side of the heading (e.g. the section's main action). */
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** One card of a settings section: a heading with a short hint, then its controls. */
export function SettingsBlock({ title, hint, action, children, className }: SettingsBlockProps) {
  return (
    <section className={cn("flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-text-primary">{title}</h2>
          {hint && <p className="mt-0.5 max-w-2xl text-sm text-text-secondary">{hint}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** A label + value pair for read-only facts (RUC, usuario, rol). */
export function Fact({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[13px] font-semibold text-text-secondary">{label}</span>
      {/* Long emails wrap instead of spilling out of a narrow column. */}
      <span className={cn("text-[15px] text-text-primary [overflow-wrap:anywhere]", mono && "font-mono")}>{children}</span>
    </div>
  );
}
