"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AppMark, Wordmark } from "./Wordmark";

const KEY = "bria:entry";
/** A curtain left by the sign-in page is only played if the app opens right after it. */
const FRESH_MS = 8000;

/** The sign-in page hands the greeting over to the app shell, which plays the second half. */
export function markEntry(name: string | null): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ name, at: Date.now() }));
  } catch {
    /* storage blocked: the app simply opens without the curtain */
  }
}

/** Reads the hand-over without consuming it (state initialisers may run twice in development). */
export function peekEntry(): { name: string | null } | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { name?: string | null; at?: number };
    return Date.now() - (v.at ?? 0) < FRESH_MS ? { name: v.name ?? null } : null;
  } catch {
    return null;
  }
}

/** Consumed once the app has mounted, so a reload never replays the curtain. */
export function clearEntry(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

interface EntryCurtainProps {
  /** `in`: grows from the sign-in panel to the whole screen. `out`: closes into the app's logo. */
  phase: "in" | "out";
  name: string | null;
  /** Where the curtain closes to (the sidebar logo), as CSS coordinates. */
  origin?: string;
  onDone?: () => void;
}

/** The welcome between signing in and the app: ink curtain, brand mark, a greeting in letters. */
export function EntryCurtain({ phase, name, origin = "36px 32px", onDone }: EntryCurtainProps) {
  const greeting = name ? `Hola, ${name}` : "Hola de nuevo";
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  // Animations pause in background tabs; never leave the curtain hanging over the app.
  useEffect(() => {
    const id = window.setTimeout(() => done.current?.(), phase === "in" ? 1400 : 2200);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div
      role="status"
      aria-live="polite"
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) done.current?.();
      }}
      className={cn("ink-scope", phase === "in" ? "curtain-in" : "curtain-out")}
      style={{ ["--curtain-origin" as string]: origin }}
    >
      <div className="curtain-content flex flex-col items-center gap-6 text-strong-foreground">
        <AppMark className="curtain-mark h-16 w-16 rounded-2xl text-[34px]" />
        <p className="px-6 text-center font-display text-[44px] font-bold leading-tight tracking-[-0.03em] sm:text-[56px]">
          <span className="sr-only">{greeting}</span>
          {/* One span per letter (they rise in turn); `.curtain-letter` keeps the spaces. Letters are
              grouped by word so a long name wraps between words, never inside one. */}
          {greeting.split(/(?<= )/).map((word, w, words) => {
            const offset = words.slice(0, w).join("").length;
            return (
              <span key={w} aria-hidden className="inline-block whitespace-nowrap">
                {word.split("").map((ch, i) => (
                  <span key={i} className="curtain-letter" style={{ animationDelay: `${120 + (offset + i) * 28}ms` }}>
                    {ch}
                  </span>
                ))}
              </span>
            );
          })}
        </p>
        <Wordmark tone="onStrong" thinking className="text-[18px] opacity-70" />
      </div>
    </div>
  );
}
