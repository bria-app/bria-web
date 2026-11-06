"use client";

import { createPortal } from "react-dom";
import { Move, Plus } from "lucide-react";
import { usePageOverlay } from "@/components/layout/PageOverlay";
import { Button } from "@/components/ui/Button";
import { usePageFlow } from "@/hooks/useDevicePref";
import { toggleWidget } from "./layout";
import { WIDGET_TITLES, type HomeLayout } from "./types";

interface CustomizePanelProps {
  layout: HomeLayout;
  onChange: (next: HomeLayout) => void;
  onReset: () => void;
  onDone: () => void;
}

/**
 * Floats over Hoy while it is being customized, so nothing on the page moves when it opens: the
 * cards themselves are what you handle, and this only says how, brings back the hidden ones and closes.
 */
export function CustomizePanel({ layout, onChange, onReset, onDone }: CustomizePanelProps) {
  const overlay = usePageOverlay();
  const [pageFlow] = usePageFlow();
  if (!overlay) return null;
  return createPortal(
    <section
      aria-label="Personalizar Hoy"
      className="pop-in pointer-events-auto absolute bottom-0 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface/95 px-3 py-2 shadow-soft-lg backdrop-blur"
    >
      <p className="flex items-center gap-2 pl-1 text-[13px] text-text-secondary">
        <Move aria-hidden className="h-4 w-4 shrink-0 text-text-muted" />
        {pageFlow === "abajo" ? "Arrastra las tarjetas y elige su ancho" : "Arrastra las tarjetas para ordenarlas"}
      </p>
      {layout.hidden.length > 0 && (
        <div role="group" aria-label="Tarjetas ocultas" className="flex flex-wrap items-center gap-1.5 border-l border-border pl-3">
          {layout.hidden.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(toggleWidget(layout, key, true))}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" /> {WIDGET_TITLES[key]}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 border-l border-border pl-3">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Restablecer
        </Button>
        <Button variant="strong" size="sm" onClick={onDone}>
          Listo
        </Button>
      </div>
    </section>,
    overlay,
  );
}
