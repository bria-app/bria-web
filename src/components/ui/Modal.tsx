"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-7xl",
  // Workspaces (the spreadsheet importer): nearly the whole screen, with a fixed height so a
  // grid inside can take the space left over.
  wide: "w-[calc(100%-1rem)] max-w-[1680px] sm:w-[calc(100%-3rem)]",
} as const;

/** Sizes whose panel keeps a fixed height instead of growing with its content. */
const fixedHeights: Partial<Record<keyof typeof sizes, string>> = {
  wide: "h-[92dvh] max-h-[92dvh]",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizes;
}

/**
 * Modal dialog built on the native <dialog>: the browser traps focus, renders it in the top
 * layer (no z-index or portal issues), restores focus to the opener on close and makes the
 * rest of the page inert. Escape and a click on the backdrop ask the parent to close.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // The control marked `data-autofocus` (usually the main button) takes the first focus.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The page behind should not scroll while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault(); // the parent owns `open`
    onClose();
  };

  // Only a press that starts and ends on the backdrop closes: selecting text in a field and
  // releasing the mouse outside the panel also fires `click` on the dialog itself.
  const pressedBackdrop = useRef(false);
  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    pressedBackdrop.current = e.target === e.currentTarget;
  };
  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
    pressedBackdrop.current = false;
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onClick={handleBackdrop}
      className={cn(
        "modal m-auto w-[calc(100%-2rem)] rounded-4xl border border-border bg-surface p-0 text-text-primary shadow-soft-xl",
        sizes[size],
      )}
    >
      {open && (
        <div className={cn("flex max-h-[88dvh] flex-col", fixedHeights[size])}>
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-6 sm:px-7">
            <div className="min-w-0">
              <h2 id={titleId} className="break-words font-display text-xl font-bold tracking-[-0.02em]">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <X aria-hidden className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="mx-5 h-px shrink-0 bg-border sm:mx-7" />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
          {footer && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 rounded-b-4xl border-t border-border bg-surface-soft/50 px-5 py-4 sm:px-7">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
