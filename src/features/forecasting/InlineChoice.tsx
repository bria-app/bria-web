"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChoiceOption {
  value: string;
  /** Text in the list. */
  label: string;
  /** Text inside the sentence when chosen (defaults to `label`). */
  phrase?: string;
  /** Options sharing a group are listed under that heading. */
  group?: string;
}

/**
 * A choice that lives inside a sentence («Predice [todo] para [el próximo mes]»): an accent
 * button that opens a listbox. Arrow keys move, Enter picks, Esc closes and returns focus.
 */
export function InlineChoice({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  /** Accessible name of the choice («Qué predecir»). */
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Opens toward the left when the choice sits near the right edge (a phone), so the list never
  // pushes the page sideways.
  const [alignEnd, setAlignEnd] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  /** True when the list (at least 240 px) would not fit to the right of the button but fits better to its left. */
  const fitsEnd = () => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return false;
    const roomRight = window.innerWidth - r.left;
    return roomRight < 256 && r.right > roomRight;
  };

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(items.length - 1, at + 1) : Math.max(0, at - 1);
      items[next]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      close();
    }
  };

  return (
    <span ref={root} className="relative inline-block">
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${current?.phrase ?? current?.label ?? ""}`}
        onClick={() => {
          if (!open) setAlignEnd(fitsEnd());
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAlignEnd(fitsEnd());
            setOpen(true);
          }
        }}
        className="inline-flex items-center gap-1 rounded-xl bg-primary-soft px-2.5 text-accent-text transition-colors hover:bg-primary-soft/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {current?.phrase ?? current?.label}
        <ChevronDown aria-hidden className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKey}
          className={cn(
            "absolute top-[calc(100%+6px)] z-30 flex max-h-80 w-max min-w-[240px] max-w-[min(360px,calc(100vw-2rem))] flex-col gap-0.5 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 font-sans text-sm font-medium leading-snug text-text-primary shadow-[0_12px_30px_rgb(var(--shadow-color)/0.14)]",
            alignEnd ? "right-0" : "left-0",
          )}
        >
          {options.map((o, i) => {
            const heading = o.group && o.group !== options[i - 1]?.group ? o.group : null;
            const on = o.value === value;
            return (
              <span key={o.value} className="contents">
                {heading && (
                  <span role="presentation" className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    {heading}
                  </span>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex min-h-9 items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left outline-none transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft",
                    on && "bg-primary-soft text-accent-text",
                  )}
                >
                  {o.label}
                  {on && <Check aria-hidden className="h-4 w-4 shrink-0" />}
                </button>
              </span>
            );
          })}
        </div>
      )}
    </span>
  );
}
