import { useState } from "react";
import { ArrowRight, Check, CircleDashed, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DoneRow {
  label: string;
  /** What is saved, in plain words. */
  value: string;
  ok: boolean;
  /** Step to go back to when it is still missing. */
  step: number;
}

interface DoneStepProps {
  rows: DoneRow[];
  products: number | null;
  onJump: (step: number) => void;
  onFinish: (to: string) => void;
  /** Saving the outcome before going into the app. */
  leaving?: boolean;
}

const HOME = "/dashboard?primeros=1";
const TILL = "/sales/new";

/** Last step: what really got saved, a shortcut back to anything missing, and where to start. */
export function DoneStep({ rows, products, onJump, onFinish, leaving = false }: DoneStepProps) {
  const ready = rows.filter((r) => r.ok).length;
  // Which way out was pressed, so only that button spins while the outcome is saved.
  const [going, setGoing] = useState<string | null>(null);
  const go = (to: string) => {
    setGoing(to);
    onFinish(to);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="pop-in grid h-14 w-14 place-items-center rounded-2xl bg-primary text-on-primary">
          <PartyPopper aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary sm:text-[42px]">
          Tu tienda está lista.
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
          {products
            ? `Ya puedes cobrar: tienes ${formatNumber(products)} ${products === 1 ? "producto cargado" : "productos cargados"}.`
            : "Puedes empezar igual. Te dejamos en Hoy una lista corta de primeros pasos para completar lo que falte."}{" "}
          Llevas {ready} de {rows.length} listos.
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <span
              aria-hidden
              className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", r.ok ? "bg-success-soft text-success" : "bg-surface-muted text-text-muted")}
            >
              {r.ok ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <CircleDashed className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-text-primary">{r.label}</span>
              <span className={cn("block break-words text-[13px]", r.ok ? "text-text-secondary" : "text-text-muted")}>{r.value}</span>
            </span>
            {!r.ok && (
              <button type="button" onClick={() => onJump(r.step)} className="shrink-0 text-[13px] font-semibold text-accent-text hover:underline">
                Completar
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-6">
        <Button size="lg" onClick={() => go(HOME)} loading={leaving && going === HOME} disabled={leaving}>
          Ir a Hoy <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
        {!!products && (
          <Button size="lg" variant="secondary" onClick={() => go(TILL)} loading={leaving && going === TILL} disabled={leaving}>
            Abrir la caja
          </Button>
        )}
      </div>
    </div>
  );
}
