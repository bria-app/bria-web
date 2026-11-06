"use client";

import { flushSync } from "react-dom";
import { LayoutGrid, Table2, type LucideIcon } from "lucide-react";
import { layoutNow } from "@/components/layout/sidewaysLayout";
import { useListView, type ListView, type ListViewScreen } from "@/hooks/useDevicePref";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ListView; label: string; icon: LucideIcon }[] = [
  { id: "tabla", label: "Ver en tabla", icon: Table2 },
  { id: "tarjetas", label: "Ver en tarjetas", icon: LayoutGrid },
];

/**
 * The list changes as one soft cross-fade: the browser keeps a picture of the old screen while the
 * new one is laid out, so nothing is seen jumping into place. What stays put doesn't flicker.
 */
function crossFade(update: () => void) {
  const page = document.documentElement;
  const calm = page.getAttribute("data-motion") === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const apply = () => {
    flushSync(update);
    const scroller = document.getElementById("contenido");
    if (scroller) layoutNow(scroller);
  };
  if (calm || !document.startViewTransition) {
    apply();
    return;
  }
  // The rows and cards' own entrance would only fight the fade.
  page.dataset.listSwitch = "";
  const transition = document.startViewTransition(apply);
  transition.ready.catch(() => {}); // rejected when a newer switch skips this one: expected
  transition.finished.finally(() => delete page.dataset.listSwitch);
}

/**
 * Table or cards, for this list only. Which way the page runs (down or sideways) is not here: it
 * is one choice for the whole app, in Configuración › Apariencia.
 */
export function ViewToggle({ screen, className }: { screen: ListViewScreen; className?: string }) {
  const [view, setView] = useListView(screen);
  return (
    <div
      role="group"
      aria-label="Cómo ver la lista"
      style={{ viewTransitionName: "list-view-toggle" }}
      className={cn("inline-flex shrink-0 gap-0.5 rounded-xl border border-border bg-surface p-0.5", className)}
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const on = view === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            aria-label={label}
            title={label}
            onClick={() => {
              if (!on) crossFade(() => setView(id));
            }}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-[10px] transition-colors",
              on ? "bg-strong text-strong-foreground" : "text-text-secondary hover:bg-surface-soft hover:text-text-primary",
            )}
          >
            <Icon aria-hidden className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
