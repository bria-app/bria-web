"use client";

import { X } from "lucide-react";

export interface Notice {
  message: string;
  undo?: () => void;
}

/**
 * Toast-like confirmation that lives inside a dialog. Page toasts render under an open
 * native <dialog> (the rest of the page is inert), so «Deshacer» must be shown here.
 */
export function InlineNotice({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  if (!notice) return null;
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl bg-strong py-2 pl-4 pr-2 text-sm font-semibold text-strong-foreground">
      <span className="min-w-0 flex-1 break-words">{notice.message}</span>
      {notice.undo && (
        <button
          type="button"
          onClick={() => {
            onDismiss();
            notice.undo?.();
          }}
          className="h-8 shrink-0 rounded-lg border border-strong-foreground/60 px-3 text-[13px] font-bold transition-opacity hover:opacity-80 focus-visible:outline-accent-on-strong"
        >
          Deshacer
        </button>
      )}
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg opacity-70 hover:opacity-100 focus-visible:outline-accent-on-strong">
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
