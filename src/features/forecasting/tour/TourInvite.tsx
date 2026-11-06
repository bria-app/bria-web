"use client";

import { StepIcon } from "@/components/brand/StepIcons";
import { Button } from "@/components/ui/Button";

/**
 * The one-time invitation on the forecast screen (Premium). Calm and dismissible: once opened
 * or closed it does not come back on this device.
 */
export function TourInvite({ onOpen, onDismiss }: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <section
      aria-label="Recorrido: cómo predice bria."
      className="rise-in relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl border border-accent-line bg-primary-softer px-5 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
    >
      <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-6 -z-10 h-32 w-32 rotate-[-8deg] text-accent-line opacity-40">
        <StepIcon name="curva" className="h-full w-full" />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-accent-text shadow-soft">
          <StepIcon name="reloj" className="h-8 w-8" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-bold leading-snug text-text-primary">¿Cómo sabe bria. cuánto vas a vender?</p>
          <p className="text-sm text-text-secondary">Míralo en siete pasos, en un minuto.</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 max-sm:pl-16">
        <Button size="sm" onClick={onOpen}>Ver el recorrido</Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>Ahora no</Button>
      </div>
    </section>
  );
}
