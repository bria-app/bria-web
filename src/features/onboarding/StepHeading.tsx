import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StepHeading({ kicker, title, text }: { kicker?: string; title: string; text: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {kicker && <p className="text-[13px] font-semibold text-accent-text">{kicker}</p>}
      <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary sm:text-[36px]">{title}</h1>
      <p className="max-w-xl text-[15px] leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

interface StepActionsProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  loading?: boolean;
  /** Moving on without doing the step is not the action to push: show it as secondary. */
  quiet?: boolean;
  /** A quiet way forward without doing the step («Saltar»). */
  onSkip?: () => void;
}

/** Back, an optional skip, and the main action at the foot of every step. */
export function StepActions({ onBack, onNext, nextLabel, loading, onSkip, quiet }: StepActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          <ArrowLeft aria-hidden className="h-4 w-4" /> Atrás
        </Button>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={loading}>
            Saltar por ahora
          </Button>
        )}
        <Button variant={quiet ? "secondary" : "primary"} onClick={onNext} loading={loading}>
          {nextLabel} <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
