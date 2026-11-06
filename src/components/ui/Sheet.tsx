"use client";

import { ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the panel (it usually has its own visible heading inside). */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Side panel from the right edge, on the native <dialog> like `Modal`: focus is trapped,
 * Escape and a click on the backdrop ask the parent to close, focus returns to the opener.
 * The layout inside is the caller's (header, scrolling body, footer).
 */
export function Sheet({ open, onClose, label, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // Same as Modal: a drag that only ends on the backdrop (text selection) must not close it.
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
        pressedBackdrop.current = false;
      }}
      className={cn("sheet flex-col border-l border-border bg-background p-0 text-text-primary shadow-soft-xl open:flex", className)}
    >
      {children}
    </dialog>
  );
}
