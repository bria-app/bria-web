"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { usePageOverlay } from "@/components/layout/PageOverlay";
import { usePageFlow } from "@/hooks/useDevicePref";
import { cn } from "@/lib/utils";

interface ListStatusProps {
  children: ReactNode;
  /** The next part of the list is on its way. */
  loading?: boolean;
  /** The next part didn't arrive. */
  onRetry?: () => void;
  /** «table» closes the table's card; «cards» stands by itself under the cards. */
  variant: "table" | "cards";
}

/**
 * How much of a list there is. A list loads as you move along it, so its end keeps moving away:
 * this stays in view instead of waiting at the end. Going down it rides the bottom of the screen;
 * going sideways it sits in the band the rail leaves free, since a column has no «bottom of the list».
 */
export function ListStatus({ children, loading, onRetry, variant }: ListStatusProps) {
  const [pageFlow] = usePageFlow();
  const overlay = usePageOverlay();

  const body = (
    <>
      <span className="min-w-0 truncate">{children}</span>
      {loading && <Loader2 aria-label="Cargando más" className="h-3.5 w-3.5 shrink-0 animate-spin" />}
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 font-semibold text-accent-text hover:underline">
          No cargó el resto. Reintentar
        </button>
      )}
    </>
  );

  if (pageFlow === "lado") {
    if (!overlay) return null;
    return createPortal(
      <div className="pop-in pointer-events-auto flex h-[42px] min-w-0 items-center gap-2 rounded-full border border-border bg-surface/95 px-4 text-[12.5px] text-text-muted shadow-soft-lg backdrop-blur">
        {body}
      </div>,
      overlay,
    );
  }

  return (
    <div
      className={cn(
        "sticky z-10 flex min-w-0 items-center gap-2 bg-surface px-5 py-3 text-[12.5px] text-text-muted",
        // A sticky bar stops at the page's padding (`main`: 2rem, and it clears the dock by itself):
        // it goes past it to the edge of the screen, or rows would show underneath.
        variant === "table" ? "bottom-[-2rem] border-t border-border" : "bottom-[-1.25rem] rounded-2xl border border-border",
      )}
    >
      {body}
    </div>
  );
}
