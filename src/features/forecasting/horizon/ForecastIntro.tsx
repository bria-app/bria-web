"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Wordmark } from "@/components/brand/Wordmark";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const SEEN = "bria-pronostico-intro";
/** Before leaving, at least this long. */
const HOLD_MS = 960;
/** And never longer than this, ready or not: a slow answer is shown loading, on the page. */
const MAX_MS = 2400;
const LEAVE_MS = 500;
/** The second visit of a session runs at this speed. */
const SHORT = 0.62;

const PAST = "M0 92 C 40 86, 60 60, 96 64 S 150 88, 186 70 S 250 34, 292 52 S 356 80, 400 58";
const AHEAD = "M400 58 C 440 44, 480 40, 560 26";
const LETTERS = "Pronóstico".split("");

function seenThisSession(): boolean {
  try {
    const seen = window.sessionStorage.getItem(SEEN) === "1";
    window.sessionStorage.setItem(SEEN, "1");
    return seen;
  } catch {
    return false;
  }
}

/** Centre of the «Pronóstico» button that was pressed, so the curtain opens out of it. */
function originOf(): string {
  for (const link of document.querySelectorAll<HTMLElement>('a[href="/forecasting"]')) {
    const r = link.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px`;
  }
  return "50% 50%";
}

const EntryContext = createContext<{ ready: boolean; contentReady: () => void }>({ ready: true, contentReady: () => undefined });

/** `ready`: the curtain is leaving, so the screen can draw itself. `contentReady`: what it needs has arrived. */
export const useForecastEntry = () => useContext(EntryContext);

type Phase = "in" | "leaving" | "gone";

/**
 * Pressing «Pronóstico»: an ink curtain opens out of the button, the line runs up to today, and the
 * curtain closes where today stands on the chart behind it, which draws itself as it clears. The
 * page loads underneath; a click or a key ends it at once. It wraps the page rather than living in
 * it so it starts with the press, not when the code of the screen has arrived.
 */
export function ForecastEntry({ children }: { children: ReactNode }) {
  const still = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("in");
  const [start] = useState(() => (typeof window === "undefined" ? { k: 1, origin: "50% 50%" } : { k: seenThisSession() ? SHORT : 1, origin: originOf() }));
  const [arrived, setArrived] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const hold = window.setTimeout(() => setHeld(true), HOLD_MS * start.k);
    const max = window.setTimeout(() => setArrived(true), MAX_MS);
    const skip = () => setPhase("gone");
    window.addEventListener("pointerdown", skip, true);
    window.addEventListener("keydown", skip, true);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(max);
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("keydown", skip, true);
    };
  }, [start.k]);

  if (held && arrived && phase === "in") setPhase("leaving");
  useEffect(() => {
    if (phase !== "leaving") return;
    const id = window.setTimeout(() => setPhase("gone"), LEAVE_MS * start.k);
    return () => window.clearTimeout(id);
  }, [phase, start.k]);

  const contentReady = useCallback(() => setArrived(true), []);
  const value = useMemo(() => ({ ready: still || phase !== "in", contentReady }), [still, phase, contentReady]);

  return (
    <EntryContext.Provider value={value}>
      {children}
      {!still &&
        phase !== "gone" &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            className={cn("fi ink-scope", phase === "leaving" && "fi-leaving")}
            style={{ "--fi-from": start.origin, "--fi-k": start.k } as React.CSSProperties}
          >
            <div className="fi-content">
              <Wordmark tone="onStrong" className="fi-mark text-[22px]" />
              <p className="font-display text-[44px] font-bold leading-none tracking-[-0.03em] text-strong-foreground sm:text-[64px]">
                {LETTERS.map((l, i) => (
                  <span key={i} className="fi-letter" style={{ "--i": i } as React.CSSProperties}>
                    {l}
                  </span>
                ))}
              </p>
              <svg viewBox="0 0 560 110" fill="none" className="fi-art w-[min(560px,84vw)]">
                <path d={PAST} pathLength={1} className="fi-past" stroke="rgb(var(--c-on-strong))" strokeWidth={3} strokeLinecap="round" />
                <path d={AHEAD} className="fi-ahead" stroke="rgb(var(--c-accent-on-strong))" strokeWidth={3} strokeLinecap="round" strokeDasharray="8 8" />
                <circle cx={400} cy={58} r={7} className="fi-today" fill="rgb(var(--c-accent-on-strong))" />
              </svg>
            </div>
          </div>,
          document.body,
        )}
    </EntryContext.Provider>
  );
}
