import { cn } from "@/lib/utils";
import { AnimatedFigure } from "@/components/ui/AnimatedFigure";

type Tone = "neutral" | "warning" | "danger";

const valueTone: Record<Tone, string> = {
  neutral: "text-text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

/** One figure of the product summary: label, monospaced value and a plain-language note. */
export function KpiTile({ label, value, note, tone = "neutral" }: { label: string; value: string; note?: string; tone?: Tone }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={cn("font-mono text-[24px] font-semibold leading-tight", valueTone[tone])}>
        <AnimatedFigure text={value} />
      </span>
      {note && <span className="text-[12.5px] text-text-muted">{note}</span>}
    </div>
  );
}
