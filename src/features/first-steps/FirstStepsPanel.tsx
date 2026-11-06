"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeOff, RotateCcw, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useProfile } from "@/hooks/useProfile";
import { useFirstSteps } from "./FirstStepsProvider";
import { ProgressRing } from "./ProgressRing";
import { StepItem } from "./StepItem";

/** The guide itself: where the shop stands, the next step opened, and how to do each one. */
export function FirstStepsPanel() {
  const { open, setOpen, steps, doneCount, next, setHidden } = useFirstSteps();
  const { company } = useProfile();
  const toast = useToast();
  const [chosen, setChosen] = useState<string | null>(null);
  const expanded = chosen ?? next?.id ?? null;

  const pending = steps.filter((s) => !s.done);
  const minutes = pending.reduce((sum, s) => sum + s.minutes, 0);
  const close = () => setOpen(false);

  const hide = () => {
    close();
    setHidden(true)
      .then(() =>
        toast("Ocultaste la guía. Vuelve a mostrarla en Configuración → Apariencia.", {
          undo: () => void setHidden(false).catch(() => toast("No se pudo volver a mostrar.")),
        }),
      )
      .catch(() => toast("No se pudo ocultar la guía."));
  };

  return (
    <Sheet open={open} onClose={close} label="Primeros pasos">
      <header className="relative shrink-0 bg-strong px-6 pb-6 pt-5 text-strong-foreground">
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl text-strong-foreground/70 hover:bg-strong-foreground/10 hover:text-strong-foreground"
        >
          <X aria-hidden className="h-[18px] w-[18px]" />
        </button>
        <p className="text-[13px] font-semibold text-accent-on-strong">Primeros pasos</p>
        <div className="mt-4 flex items-center gap-4 pr-8">
          <ProgressRing done={doneCount} total={steps.length} size={72} stroke={5} onStrong label />
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em]">
              {pending.length ? `Pon en marcha ${company?.name ?? "tu tienda"}` : "¡Todo listo!"}
            </h2>
            <p className="mt-1 text-[13.5px] text-strong-foreground/70">
              {pending.length
                ? `Te ${pending.length === 1 ? "falta 1 paso" : `faltan ${pending.length} pasos`} · unos ${minutes} minutos`
                : "Tu tienda ya está en marcha."}
            </p>
          </div>
        </div>
      </header>

      <ol className="flex-1 overflow-y-auto px-5 py-5">
        {steps.map((step, i) => (
          <StepItem
            key={step.id}
            step={step}
            index={i}
            last={i === steps.length - 1}
            isNext={step.id === next?.id}
            expanded={!step.done && expanded === step.id}
            onToggle={() => setChosen(expanded === step.id ? "" : step.id)}
            onGo={close}
          />
        ))}
      </ol>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
        <Link href="/welcome" onClick={close} className="btn btn-ghost h-9 gap-1.5 px-2.5 text-[13px]">
          <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Repasar la configuración
        </Link>
        <button type="button" onClick={hide} className="btn btn-ghost h-9 gap-1.5 px-2.5 text-[13px]">
          <EyeOff aria-hidden className="h-3.5 w-3.5" /> Ocultar la guía
        </button>
      </footer>
    </Sheet>
  );
}
