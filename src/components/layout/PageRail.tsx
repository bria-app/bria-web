"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { columnStep } from "./sidewaysLayout";
import { glideTo } from "./useSidewaysPage";

/**
 * «Página hacia el lado»: a slim track that shows how much of the strip is in view and where,
 * like a scrollbar laid on its side. Drag it, or press on it to slide there; the arrows move a
 * screen at a time. It only shows up when the strip is wider than the screen.
 */
export function PageRail({ scroller, pathname }: { scroller: RefObject<HTMLElement | null>; pathname: string }) {
  const [pos, setPos] = useState({ start: 0, size: 1, atStart: true, atEnd: true });
  const track = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      const width = Math.max(1, el.scrollWidth);
      setPos({
        start: el.scrollLeft / width,
        size: Math.min(1, el.clientWidth / width),
        atStart: el.scrollLeft <= 2,
        atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
    };
    // Cards coming in slide from the right and widen the strip for a moment: measure again once
    // they have landed, or the rail would show for a page that fits the screen.
    let settle = 0;
    const laidOut = () => {
      measure();
      clearTimeout(settle);
      settle = window.setTimeout(measure, 1000);
    };
    laidOut();
    el.addEventListener("scroll", measure, { passive: true });
    el.addEventListener("sideways-layout", laidOut);
    return () => {
      clearTimeout(settle);
      el.removeEventListener("scroll", measure);
      el.removeEventListener("sideways-layout", laidOut);
    };
  }, [scroller, pathname]);

  const by = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) glideTo(el, el.scrollLeft + dir * Math.max(columnStep(el), el.clientWidth * 0.85));
  };

  /** Press on the track: the view centres there; keep the button down to drag it along. */
  const grab = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const el = scroller.current;
    const bar = track.current;
    if (!el || !bar) return;
    const box = bar.getBoundingClientRect();
    const toLeft = (clientX: number) => ((clientX - box.left) / box.width - pos.size / 2) * el.scrollWidth;
    glideTo(el, toLeft(e.clientX));
    bar.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      el.scrollLeft = toLeft(ev.clientX);
    };
    const up = () => {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
      bar.removeEventListener("pointercancel", up);
    };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
    bar.addEventListener("pointercancel", up);
  };

  if (pos.size >= 0.999) return null;
  const arrow = "grid h-8 w-8 place-items-center rounded-full text-text-secondary hover:bg-surface-muted hover:text-text-primary disabled:opacity-35";
  return (
    <div className="pop-in pointer-events-auto absolute bottom-[calc(var(--dock-clear,0px)+1rem)] right-6 z-20 flex items-center gap-1.5 rounded-full border border-border bg-surface/95 p-1 shadow-soft-lg backdrop-blur">
      <button type="button" onClick={() => by(-1)} disabled={pos.atStart} aria-label="Hacia la izquierda" className={arrow}>
        <ChevronLeft aria-hidden className="h-4 w-4" />
      </button>
      <span
        ref={track}
        role="scrollbar"
        aria-label="Dónde estás en la página"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-controls="contenido"
        aria-valuenow={Math.round((pos.start / Math.max(0.0001, 1 - pos.size)) * 100)}
        onPointerDown={grab}
        className="relative h-2 w-36 cursor-pointer touch-none overflow-hidden rounded-full bg-surface-muted"
      >
        <span
          className="absolute inset-y-0 rounded-full bg-text-secondary/70"
          style={{ left: `${pos.start * 100}%`, width: `${Math.max(pos.size * 100, 8)}%` }}
        />
      </span>
      <button type="button" onClick={() => by(1)} disabled={pos.atEnd} aria-label="Hacia la derecha" className={arrow}>
        <ChevronRight aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
