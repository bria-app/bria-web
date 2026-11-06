import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { FirstStep } from "./steps";

interface StepItemProps {
  step: FirstStep;
  index: number;
  last: boolean;
  /** The first pending step: the one to do now. */
  isNext: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** Called when following a link (closes the panel). */
  onGo: () => void;
}

/** One step on the timeline: a dot joined to the next, a header that opens the how-to. */
export function StepItem({ step, index, last, isNext, expanded, onToggle, onGo }: StepItemProps) {
  const Icon = step.icon;
  const bodyId = `first-step-${step.id}`;

  return (
    <li className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-3">
      {!last && (
        <span
          aria-hidden
          className={cn("absolute left-[17px] top-10 bottom-0 w-0.5 rounded-full", step.done ? "bg-success/40" : "bg-border")}
        />
      )}
      <span
        aria-hidden
        className={cn(
          "relative z-10 mt-1.5 grid h-9 w-9 place-items-center rounded-full border-2 text-[13px] font-bold",
          step.done && "border-transparent bg-success-soft text-success",
          !step.done && isNext && "border-primary bg-primary text-on-primary",
          !step.done && !isNext && "border-border bg-background text-text-muted",
        )}
      >
        {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
      </span>

      <div className={cn("min-w-0", !last && "pb-4")}>
        {step.done ? (
          <div className="flex min-h-12 items-center gap-2 py-1.5">
            <span className="min-w-0 truncate text-[14px] font-medium text-text-muted">{step.title}</span>
            <Badge tone="success">Hecho</Badge>
          </div>
        ) : (
          <div className={cn("rounded-2xl border transition-colors", expanded ? "border-border bg-surface shadow-soft" : "border-transparent")}>
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={bodyId}
              className="flex min-h-12 w-full items-center gap-2 rounded-2xl px-3 py-2 text-left hover:bg-surface-soft"
            >
              <span className={cn("min-w-0 flex-1 text-[14.5px] font-semibold", isNext || expanded ? "text-text-primary" : "text-text-secondary")}>
                {step.title}
              </span>
              {step.optional && <span className="text-[11.5px] font-medium text-text-muted">Opcional</span>}
              <span className="font-mono text-[11.5px] text-text-muted">{step.minutes} min</span>
              <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
              <div id={bodyId} className="pop-in flex flex-col gap-3 px-3 pb-3.5">
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-accent-text">
                    <Icon aria-hidden className="h-[18px] w-[18px]" />
                  </span>
                  <p className="text-[13.5px] leading-relaxed text-text-secondary">{step.why}</p>
                </div>
                <ul className="flex flex-col gap-1.5 pl-1">
                  {step.how.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[13px] text-text-secondary">
                      <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted/60" />
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link href={step.cta.href} onClick={onGo} className={cn("btn h-10 gap-1.5 px-4 text-[13.5px]", isNext ? "btn-primary" : "btn-strong")}>
                    {step.cta.label} <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                  {step.alt && (
                    <Link href={step.alt.href} onClick={onGo} className="btn btn-ghost h-10 px-3 text-[13.5px]">
                      {step.alt.label}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
