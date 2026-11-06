import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** While bria is working (e.g. computing a forecast) the final dot becomes three. */
  thinking?: boolean;
  /** `onStrong` when placed on a `bg-strong` surface (e.g. the sign-in panel). */
  tone?: "default" | "onStrong";
}

/** The «bria.» wordmark: «ia» in the brand amber, a period that means "done". */
export function Wordmark({ className, thinking = false, tone = "default" }: WordmarkProps) {
  const onStrong = tone === "onStrong";
  return (
    <span
      className={cn(
        "font-display font-extrabold tracking-[-0.015em]",
        onStrong ? "text-strong-foreground" : "text-text-primary",
        className,
      )}
    >
      br<span className={onStrong ? "text-accent-on-strong" : "text-brand"}>ia</span>
      {thinking ? (
        <span aria-label="Calculando" role="img">
          <span className="thinking-dot">.</span>
          <span className="thinking-dot [animation-delay:0.15s]">.</span>
          <span className="thinking-dot [animation-delay:0.3s]">.</span>
        </span>
      ) : (
        "."
      )}
    </span>
  );
}

/** Square app mark: an ink «b.» on amber, the same in light and dark. */
export function AppMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-[20px] font-extrabold leading-none tracking-[-0.03em] text-on-primary",
        className,
      )}
    >
      <span className="-mt-0.5">
        b<span className="text-on-primary/45">.</span>
      </span>
    </span>
  );
}
