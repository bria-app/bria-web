import { cn } from "@/lib/utils";
import { AnimatedFigure } from "@/components/ui/AnimatedFigure";

/** A labelled figure: small label, mono value, one line of context. */
export function NumberTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  /** Colors the note, which always says the state in words. */
  tone?: "success" | "warning" | "danger";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5">
      <span className="text-[12px] font-medium text-text-muted">{label}</span>
      <span className="font-mono text-2xl text-text-primary">
        <AnimatedFigure text={value} />
      </span>
      {note && (
        <span
          className={cn(
            "text-[12px]",
            tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-text-muted",
          )}
        >
          {note}
        </span>
      )}
    </div>
  );
}
