"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Horizontal scroller that says where the content continues.
 *
 * A wide table cut by the viewport looks broken rather than scrollable, so the edges
 * fade while there is more to see and a hint appears the first time, until the person
 * scrolls.
 */
export function ScrollShadow({
  children,
  className,
  hint,
}: {
  children: React.ReactNode;
  className?: string;
  /** Short nudge shown on the right edge while the content still continues. */
  hint?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  // The nudge is a greeting, not furniture: it steps aside on its own.
  const [nudge, setNudge] = useState(true);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft > 4;
    const right = max - el.scrollLeft > 4;
    // Scrolling fires this on every frame: only re-render when an edge actually appears or goes.
    setEdge((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    // Columns can be shown or hidden, so the content's own width is watched too.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    const bye = window.setTimeout(() => setNudge(false), 4500);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      window.clearTimeout(bye);
    };
  }, [measure]);

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="relative overflow-x-auto">
        {children}
      </div>
      {edge.left && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-surface to-transparent" />
      )}
      {edge.right && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent" />
          {hint && nudge && !edge.left && (
            <span className="animate-fade-up pointer-events-none absolute right-3 top-2.5 z-30 rounded-full border border-border bg-surface/95 px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-soft backdrop-blur">
              {hint}
            </span>
          )}
        </>
      )}
    </div>
  );
}
