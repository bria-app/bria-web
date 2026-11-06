import { Check } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { cn } from "@/lib/utils";

interface WelcomeHeaderProps {
  /** Step labels after the greeting. */
  steps: readonly string[];
  /** 0 = greeting; 1…steps.length = those steps. */
  current: number;
  onJump: (index: number) => void;
  onLeave: () => void;
  /** Saving the progress before leaving. */
  leaving?: boolean;
}

/** Logo, the steps (done ones can be revisited), and a way out that keeps progress. */
export function WelcomeHeader({ steps, current, onJump, onLeave, leaving = false }: WelcomeHeaderProps) {
  const progress = Math.round((current / steps.length) * 100);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Wordmark className="shrink-0 text-[22px]" />
        {/* Eight named steps and the actions need about 1100 px; narrower screens get «Paso 3 de 8». */}
        <ol aria-label="Pasos" className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {steps.map((label, i) => {
            const index = i + 1;
            const done = index < current;
            const here = index === current;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => onJump(index)}
                  disabled={index > current}
                  aria-current={here ? "step" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-colors",
                    here && "bg-strong text-strong-foreground",
                    done && "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                    !here && !done && "text-text-muted",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold",
                      here ? "bg-primary text-on-primary" : done ? "bg-success-soft text-success" : "bg-surface-muted",
                    )}
                  >
                    {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
        <span className="ml-auto min-w-0 truncate text-[13px] text-text-muted xl:hidden">
          {current === 0 ? "Bienvenida" : `Paso ${current} de ${steps.length}`}
        </span>
        <ModeToggle />
        <Button variant="ghost" size="sm" onClick={onLeave} loading={leaving} className="shrink-0">
          Terminar después
        </Button>
      </div>
      <div
        role="progressbar"
        aria-label="Avance de la configuración"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-0.5 bg-surface-muted"
      >
        <div className="h-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}
