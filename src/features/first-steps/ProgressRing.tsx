import { cn } from "@/lib/utils";

interface ProgressRingProps {
  done: number;
  total: number;
  size: number;
  stroke?: number;
  /** Ring on an ink background (track and text adapt). */
  onStrong?: boolean;
  /** Shows «3/7» in the centre. */
  label?: boolean;
  className?: string;
}

/** Circular progress in amber; purely visual (the caller states the progress in text). */
export function ProgressRing({ done, total, size, stroke = 3, onStrong = false, label = false, className }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = total ? Math.min(done / total, 1) : 0;

  return (
    <span aria-hidden className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={onStrong ? "stroke-strong-foreground/15" : "stroke-surface-muted"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {label && (
        <span
          className={cn(
            "absolute font-mono font-medium leading-none",
            onStrong ? "text-strong-foreground" : "text-text-primary",
            size >= 64 ? "text-[17px]" : "text-[10.5px]",
          )}
        >
          {done}/{total}
        </span>
      )}
    </span>
  );
}
