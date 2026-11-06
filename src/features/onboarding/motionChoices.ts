import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Columns3, GalleryHorizontal, type LucideIcon } from "lucide-react";
import type { PageFlow, SectionMotion } from "@/hooks/useDevicePref";

export interface MotionOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** What the option does, in one plain line. */
  text: string;
}

export interface MotionRow<T extends string> {
  label: string;
  hint: string;
  options: readonly MotionOption<T>[];
}

/* Copy follows what the app really does: AppShell (page-enter / page-slide + swipe between
   sections) and sidewaysLayout (whole pieces in columns, the wheel slides them). */
export const SECTION_ROW: MotionRow<SectionMotion> = {
  label: "Cambio de sección",
  hint: "Cuando pasas de una sección a otra, por ejemplo de Hoy a Inventario.",
  options: [
    { value: "subir", label: "Subir", icon: ArrowUpFromLine, text: "La pantalla nueva aparece en su sitio: sus bloques suben uno tras otro." },
    { value: "deslizar", label: "Deslizar de lado", icon: GalleryHorizontal, text: "Entra de costado, como una diapositiva. También cambias de sección deslizando de lado." },
  ],
};

export const PAGE_ROW: MotionRow<PageFlow> = {
  label: "La página",
  hint: "Cómo recorres una pantalla que no entra entera.",
  options: [
    { value: "abajo", label: "Hacia abajo", icon: ArrowDownToLine, text: "Bajas con la rueda o el dedo, como en cualquier página." },
    { value: "lado", label: "Hacia el lado", icon: Columns3, text: "Todo se acomoda en columnas que siguen hacia la derecha, y la rueda lo desliza de corrido." },
  ],
};

/** A preference the preview is acting out; `run` changes to play it again. */
export type PreviewDemo =
  | { kind: "section"; value: SectionMotion; run: number }
  | { kind: "page"; value: PageFlow; run: number };

export type DemoKind = PreviewDemo["kind"];

/** A demo to play, before it gets its run number. */
export type DemoPick =
  | { kind: "section"; value: SectionMotion }
  | { kind: "page"; value: PageFlow };

export const DEMO_ROWS: Record<DemoKind, MotionRow<string>> = { section: SECTION_ROW, page: PAGE_ROW };

/** How long each beat of a demo lasts, ms (the last one is the hold before it ends). */
const TIMELINE: Record<DemoKind, readonly number[]> = {
  // Hoy → Inventario → Hoy → Inventario.
  section: [650, 1600, 1600, 2200],
  // Top (or page 1) → middle → end.
  page: [900, 1500, 2400],
};

/** With reduced motion nothing plays: each demo holds one telling frame instead. */
const STILL: Record<DemoKind, number> = { section: 1, page: 1 };

/**
 * The beat a demo is on. It restarts whenever `demo.run` changes, steps on by itself while motion
 * is allowed and calls `onEnd` after the last beat.
 */
export function useDemoBeat(demo: PreviewDemo | null, animate: boolean, onEnd?: () => void): number {
  const run = demo?.run ?? 0;
  const [state, setState] = useState({ run, beat: 0 });
  // Adjusting state while rendering (not in an effect), so a new run starts on its first frame.
  if (state.run !== run) setState({ run, beat: 0 });
  const beat = state.run === run ? state.beat : 0;
  const kind = demo?.kind ?? null;

  useEffect(() => {
    if (!kind || !animate) return;
    const steps = TIMELINE[kind];
    const t = window.setTimeout(() => {
      if (beat >= steps.length - 1) onEnd?.();
      else setState((s) => (s.run === run ? { run, beat: s.beat + 1 } : s));
    }, steps[beat]);
    return () => window.clearTimeout(t);
  }, [kind, animate, beat, run, onEnd]);

  if (!kind) return 0;
  return animate ? beat : STILL[kind];
}
