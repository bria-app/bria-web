import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { ShopIcon, SHOP_ICONS } from "@/components/brand/ShopIcons";
import { Card } from "./Card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Primary call to action pointing at the next step of the flow. */
  action?: { label: string; href?: string; onClick?: () => void };
  /** A small hint shown under the action (e.g. a prerequisite). */
  hint?: ReactNode;
  className?: string;
}

/** Two product icons per empty state, picked from the title so each screen keeps its own pair. */
function peeksFor(title: string) {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  // Unsigned shifts only: a signed one can go negative and index outside the list.
  return [SHOP_ICONS[h % SHOP_ICONS.length], SHOP_ICONS[(h >>> 4) % SHOP_ICONS.length]];
}

/**
 * A guided empty state: instead of a dead-end "No data", it names what the screen is
 * for and offers the next action in the flow. Used wherever a list can be empty.
 */
export function EmptyState({ icon: Icon, title, description, action, hint, className }: EmptyStateProps) {
  const actionClass = "btn btn-primary mt-2 h-10 gap-1.5 px-4 text-sm group";
  const [left, right] = peeksFor(title);
  return (
    <Card className={className}>
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div aria-hidden className="relative">
          <span className="empty-peek absolute -left-9 top-3 grid h-9 w-9 -rotate-12 place-items-center rounded-xl border border-border bg-surface [animation-delay:180ms]">
            <ShopIcon name={left} className="h-5 w-5 text-text-muted" />
          </span>
          <span className="empty-peek absolute -right-9 top-1 grid h-9 w-9 rotate-12 place-items-center rounded-xl border border-border bg-surface [animation-delay:280ms]">
            <ShopIcon name={right} className="h-5 w-5 text-text-muted" />
          </span>
          <div className="empty-float grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-accent-text">
            <Icon aria-hidden className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-balance font-display text-lg font-bold tracking-[-0.02em] text-text-primary">{title}</p>
          <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-text-secondary">{description}</p>
        </div>
        {action &&
          (action.href ? (
            <Link href={action.href} className={actionClass}>
              {action.label} <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass}>
              {action.label} <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        {hint && <p className="max-w-sm text-xs text-text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
