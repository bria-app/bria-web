import { CheckCircle2, type LucideIcon } from "lucide-react";
import { ChoiceCard } from "./ChoiceCard";
import { StepActions, StepHeading } from "./StepHeading";

export interface LoadOption {
  icon: LucideIcon;
  title: string;
  text: string;
  tag?: string;
  onClick: () => void;
}

interface LoadStepProps {
  kicker: string;
  title: string;
  text: string;
  /** What is already loaded, from the API; null while unknown or when nothing is loaded yet. */
  done: string | null;
  options: LoadOption[];
  tip?: string | null;
  onBack: () => void;
  onNext: () => void;
}

/** Load products or past sales (import or by hand), or leave it for later. */
export function LoadStep({ kicker, title, text, done, options, tip, onBack, onNext }: LoadStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <StepHeading kicker={kicker} title={title} text={text} />
      {done && (
        <p role="status" className="flex items-center gap-2.5 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" /> {done}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <ChoiceCard key={o.title} {...o} />
        ))}
      </div>
      {tip && <p className="text-[13px] text-text-muted">{tip}</p>}
      <StepActions onBack={onBack} onNext={onNext} nextLabel={done ? "Continuar" : "Lo hago después"} quiet={!done} />
    </div>
  );
}
