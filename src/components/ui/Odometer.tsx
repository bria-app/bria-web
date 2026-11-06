"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/** Where a figure starts when it first appears: close to itself, never a false zero. */
const START = 0.85;

/**
 * A figure whose digits roll to their value, like a mechanical counter. Only `transform` moves,
 * so it costs nothing to keep changing it (the chart's cursor does, month by month). Screen
 * readers get the exact text at once.
 */
export function Odometer({
  value,
  format,
  className,
  fromStart = true,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  /** Roll in from a close figure on arrival, or simply show the value. */
  fromStart?: boolean;
}) {
  const exact = format(value);
  const [shown, setShown] = useState(fromStart ? format(value * START) : exact);

  useEffect(() => {
    // The next frame, so the roll to the first value is seen too.
    const id = requestAnimationFrame(() => setShown(exact));
    return () => cancelAnimationFrame(id);
  }, [exact]);

  // Columns are counted from the right: units stay units when the figure gains a digit.
  const chars = shown.padStart(exact.length, " ").split("");
  return (
    <span className={cn("odo", className)}>
      <span className="sr-only">{exact}</span>
      <span aria-hidden className="odo-row">
        {chars.map((c, i) => {
          const fromRight = chars.length - i;
          const digit = Number(c);
          return c === " " || Number.isNaN(digit) ? (
            <span key={`s${fromRight}`} className="odo-sep">
              {c === " " ? "" : c}
            </span>
          ) : (
            <span key={`d${fromRight}`} className="odo-col" style={{ "--d": digit, "--i": fromRight } as React.CSSProperties}>
              {DIGITS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}
