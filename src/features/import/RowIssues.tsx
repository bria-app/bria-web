"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface RowIssuesProps {
  rowNumber: number;
  errors: string[];
  /** Opens the first cell with a problem. */
  onFix: () => void;
}

const TIP_WIDTH = 300;

/**
 * The row's warning: a count that says why on hover or focus. The reasons open as a `popover`
 * (browser top layer), so the grid's scroll box never clips them, and they are always in the
 * DOM for screen readers through `aria-describedby`.
 */
export function RowIssues({ rowNumber, errors, onFix }: RowIssuesProps) {
  const tipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.right + 8, window.innerWidth - TIP_WIDTH - 8));
    // Below the trigger when it would cover it (narrow screens), otherwise beside it.
    const beside = r.right + 8 + TIP_WIDTH <= window.innerWidth;
    const top = beside ? r.top - 4 : r.bottom + 6;
    setPos({ top: Math.min(top, window.innerHeight - 160), left });
  };
  const hide = () => setPos(null);

  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    if (pos && !el.matches(":popover-open")) el.showPopover();
    if (!pos && el.matches(":popover-open")) el.hidePopover();
  }, [pos]);

  const count = errors.length;
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === "Escape" && pos) {
            e.stopPropagation(); // close the reasons, not the dialog
            hide();
          }
        }}
        onClick={() => {
          hide();
          onFix();
        }}
        aria-label={`Fila ${rowNumber}: ${count === 1 ? "1 problema" : `${count} problemas`}. Corregir`}
        aria-describedby={tipId}
        className="inline-flex h-6 items-center gap-1 rounded-md border border-danger/30 bg-danger-soft px-1.5 font-mono text-[11px] font-semibold text-danger hover:border-danger"
      >
        <AlertTriangle aria-hidden className="h-3 w-3" />
        {count}
      </button>
      <div
        ref={tipRef}
        id={tipId}
        role="tooltip"
        popover="manual"
        style={pos ? { position: "fixed", inset: "auto", margin: 0, top: pos.top, left: pos.left, width: TIP_WIDTH } : undefined}
        className={cn(
          "rounded-xl border border-border bg-surface p-3 text-left font-sans text-text-primary shadow-soft-xl",
          !reduced && "animate-fade-up",
        )}
      >
        <p className="text-[12px] font-semibold text-danger">
          Fila {rowNumber}: {count === 1 ? "1 dato por corregir" : `${count} datos por corregir`}
        </p>
        <ul className="mt-1.5 space-y-1 text-[12.5px] leading-snug text-text-secondary">
          {errors.slice(0, 6).map((e, i) => (
            <li key={i} className="flex gap-1.5">
              <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
              {e}
            </li>
          ))}
          {count > 6 && <li className="text-text-muted">y {count - 6} más</li>}
        </ul>
        <p className="mt-2 text-[11.5px] text-text-muted">Haz clic para corregirlo, o quita la fila.</p>
      </div>
    </>
  );
}
