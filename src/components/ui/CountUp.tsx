"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CountUpProps {
  value: number;
  format: (n: number) => string;
  /** Milliseconds; the count eases out so it slows into the real figure. */
  duration?: number;
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Where a figure starts counting when it first appears: close to itself, never a false zero. */
const START = 0.85;

/**
 * A figure that counts up to its value (and glides to a new one when it changes). The final
 * text is always the exact value; screen readers get it at once from visually hidden text.
 */
export function CountUp({ value, format, duration = 900, className }: CountUpProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(() => value * START);
  const from = useRef(value * START);

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const origin = from.current;
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const next = origin + (value - origin) * easeOut(t);
      setShown(next);
      from.current = next;
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    // Frames can be throttled (background tabs, hidden panes): the exact value always lands.
    const settle = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      setShown(value);
      from.current = value;
    }, duration + 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [value, duration, reduced]);

  return (
    <span className={className}>
      {/* A plain span cannot carry an aria-label, so the exact value is read from hidden text. */}
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden>{format(reduced ? value : shown)}</span>
    </span>
  );
}
