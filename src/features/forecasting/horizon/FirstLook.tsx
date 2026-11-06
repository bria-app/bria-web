"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Box = { left: number; top: number; width: number; height: number };

interface Step {
  title: string;
  text: string;
  /** Where the light falls, measured every frame: the page may scroll or settle. */
  find: () => Box | null;
}

const PAD = 8;
const CARD_W = 340;
const CARD_H = 196;
const START_AFTER_MS = 1900;

const boxOf = (el: Element | null | undefined): Box | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
};

/** The chart cut at today: the past on one side, what comes on the other. */
function chartPart(part: "past" | "future"): Box | null {
  const chart = document.querySelector('[data-look="chart"]');
  const zone = chart?.querySelector('[data-n="zone"]');
  const whole = boxOf(chart);
  if (!whole || !zone) return whole;
  const x = Number(zone.getAttribute("x") ?? 0);
  return part === "past" ? { ...whole, width: x } : { ...whole, left: whole.left + x, width: whole.width - x };
}

/** The look at what is on screen, once on each device: what each part means, and where to go next. */
export function FirstLook({ hasResult, onDone }: { hasResult: boolean; onDone: () => void }) {
  const steps = useMemo<Step[]>(() => {
    const out: Step[] = [
      {
        title: "Tu pregunta",
        text: "Elige qué predecir y para cuándo. El dibujo cambia contigo.",
        find: () => boxOf(document.querySelector('[data-look="ask"]')),
      },
      {
        title: "Lo que ya vendiste",
        text: "Esta línea son tus ventas reales. De ahí aprende bria.",
        find: () => chartPart("past"),
      },
      {
        title: "Lo que viene",
        text: hasResult
          ? "Desde hoy, la línea punteada es lo que esperamos que vendas. La banda es el rango probable: mientras más ancha, menos seguro."
          : "Aquí aparecerá lo que esperamos que vendas. Toca «Calcular» para verlo.",
        find: () => chartPart("future"),
      },
    ];
    if (hasResult) {
      out.push(
        {
          title: "Mes a mes",
          text: "Pasa el cursor por el gráfico: la frase de arriba te dirá la cifra de ese mes.",
          find: () => boxOf(document.querySelector('[data-look="chart"]')),
        },
        {
          title: "Qué hacer con esto",
          text: "Aquí está el resumen y, más abajo, cada producto. Toca uno para ver su detalle.",
          find: () => boxOf(document.querySelector('[data-look="next"]')),
        },
      );
    }
    return out;
  }, [hasResult]);

  const [at, setAt] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  // First the line draws itself; explaining it comes after.
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setWaited(true), START_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);
  const step = steps[Math.min(at, steps.length - 1)];
  const card = useRef<HTMLDivElement>(null);

  // Bring the part into view, then keep the light on it as the page settles.
  useEffect(() => {
    const scroller = document.querySelector("main");
    const target = step.find();
    if (scroller && target) {
      const view = scroller.getBoundingClientRect();
      const outside =
        target.top < view.top + 8 || target.top + Math.min(target.height, view.height) > view.bottom - 8 || target.left < view.left || target.left + Math.min(target.width, view.width) > view.right;
      if (outside) {
        scroller.scrollBy({
          top: target.top - view.top - 110,
          left: target.left < view.left || target.left + target.width > view.right ? target.left - view.left - 32 : 0,
          behavior: "smooth",
        });
      }
    }
    let frame = 0;
    const track = () => {
      const b = step.find();
      setBox((old) =>
        b && old && Math.abs(b.left - old.left) < 0.5 && Math.abs(b.top - old.top) < 0.5 && Math.abs(b.width - old.width) < 0.5 && Math.abs(b.height - old.height) < 0.5 ? old : b,
      );
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    card.current?.querySelector<HTMLButtonElement>("[data-next]")?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const advance = useCallback(() => {
    if (at >= steps.length - 1) onDone();
    else setAt(at + 1);
  }, [at, steps.length, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      else if (e.key === "ArrowRight") advance();
      else if (e.key === "ArrowLeft") setAt((a) => Math.max(0, a - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onDone]);

  if (!box || !waited) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hole = {
    left: Math.max(4, box.left - PAD),
    top: Math.max(4, box.top - PAD),
    width: Math.min(box.width + PAD * 2, vw - 8),
    height: Math.min(box.height + PAD * 2, vh - 8),
  };
  // Beside the light if it fits below, else above, else over its own lower edge.
  const below = hole.top + hole.height + 14;
  const above = hole.top - CARD_H - 14;
  const top = below + CARD_H < vh ? below : above > 8 ? above : Math.max(8, vh - CARD_H - 16);
  const width = Math.min(CARD_W, vw - 32);
  const left = Math.max(16, Math.min(vw - width - 16, hole.left + hole.width / 2 - width / 2));

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={`Primer vistazo: ${step.title}`}>
      <div aria-hidden className="look-hole absolute rounded-3xl" style={hole} />
      <div key={at} ref={card} className="look-card absolute flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-text-primary shadow-soft-xl" style={{ left, top, width }}>
        <p className="font-display text-[19px] font-bold tracking-[-0.02em]">{step.title}</p>
        <p className="text-sm leading-relaxed text-text-secondary">{step.text}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button type="button" onClick={onDone} className="rounded-lg px-1 text-sm text-text-muted hover:text-text-primary">
            Saltar
          </button>
          <span aria-label={`Paso ${at + 1} de ${steps.length}`} className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <span key={s.title} aria-hidden className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === at ? "bg-primary" : "bg-surface-muted")} />
            ))}
          </span>
          <Button data-next size="sm" onClick={advance}>
            {at === steps.length - 1 ? "Entendido" : "Siguiente"}
            {at < steps.length - 1 && <ArrowRight aria-hidden className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
