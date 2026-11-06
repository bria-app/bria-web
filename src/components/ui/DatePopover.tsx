"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/** The calendar with its padding: where it fits is decided before it is drawn. */
const WIDTH = 314;
const HEIGHT = 392;

/** Where the panel of `anchor` lives: inside its dialog if it has one (outside would be inert). */
export const popoverHost = (anchor: Element | null): HTMLElement => anchor?.closest("dialog") ?? document.body;

interface DatePopoverProps {
  anchor: RefObject<HTMLElement | null>;
  /** Where it is open (see `popoverHost`); null when closed. */
  host: HTMLElement | null;
  /** `refocus`: the keyboard asked to leave, so focus goes back to what opened it. */
  onClose: (refocus: boolean) => void;
  label: string;
  children: ReactNode;
}

/**
 * The floating panel a calendar opens in. It lives in the browser's top layer, like `Select`, so no
 * scroll container clips it and nothing on the page moves.
 */
export function DatePopover({ anchor, host, onClose, label, children }: DatePopoverProps) {
  const panel = useRef<HTMLDivElement>(null);
  const open = host !== null;

  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    const place = () => {
      const a = anchor.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 14;
      const top = below >= HEIGHT || r.top - 14 < HEIGHT ? r.bottom + 6 : r.top - HEIGHT - 6;
      el.style.top = `${Math.max(8, Math.min(top, window.innerHeight - HEIGHT - 8))}px`;
      el.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8))}px`;
    };
    place();
    // Into the top layer, with the keyboard on the calendar's current day.
    el.showPopover();
    el.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]')?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!anchor.current?.contains(t) && !panel.current?.contains(t)) onClose(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, anchor, onClose]);

  if (!host) return null;
  return createPortal(
    <div
      ref={panel}
      popover="manual"
      role="dialog"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "Tab") return;
        // The arrows belong to the calendar here, not to the page behind it.
        e.stopPropagation();
        if (e.key !== "Escape") return;
        e.preventDefault();
        onClose(true);
      }}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !panel.current?.contains(next) && !anchor.current?.contains(next)) onClose(false);
      }}
      style={{ position: "fixed", inset: "auto", margin: 0 }}
      className="rounded-2xl border border-border bg-surface p-4 text-text-primary shadow-soft-xl animate-fade-up"
    >
      {children}
    </div>,
    host,
  );
}
