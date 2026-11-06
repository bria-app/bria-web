import { ArrowRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ChoiceCardProps {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
  /** Marks the suggested option. */
  tag?: string;
}

/** A large, clickable option: icon, title, one line, arrow. */
export function ChoiceCard({ icon: Icon, title, text, onClick, tag }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-text-muted/50 sm:p-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-text-secondary">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-text-primary">
          {title}
          {tag && <Badge tone="accent">{tag}</Badge>}
        </span>
        <span className="block text-sm text-text-secondary">{text}</span>
      </span>
      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
