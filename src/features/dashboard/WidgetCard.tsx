import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface WidgetCardProps {
  title: string;
  /** Short note on the right of the title («Último mes», «3 pendientes»). */
  note?: string;
  /** «Ver todo» link in the footer. */
  more?: { label: string; href: string };
  children: ReactNode;
}

/** One widget of the home grid. */
export function WidgetCard({ title, note, more, children }: WidgetCardProps) {
  return (
    <Card className="@container flex h-full min-w-0 flex-col gap-4 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
        {note && <span data-card-note className="text-xs text-text-muted">{note}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {more && (
        <Link
          href={more.href}
          className="inline-flex items-center gap-1 self-start rounded-lg text-[13px] font-semibold text-accent-text hover:underline"
        >
          {more.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </Card>
  );
}

/** Empty state inside a widget: fills the card and centres, so cards of one row stay even. */
export function WidgetEmpty({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">
      {Icon && (
        <span className="mb-1 grid h-11 w-11 place-items-center rounded-2xl bg-surface-soft text-text-muted">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
      )}
      {children}
    </div>
  );
}
