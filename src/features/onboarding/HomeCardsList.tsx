import { ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { moveWidget, toggleWidget } from "@/features/dashboard/layout";
import { WIDGET_TITLES, type HomeLayout } from "@/features/dashboard/types";

const arrowClass =
  "grid h-9 w-9 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary disabled:opacity-30";

/** Hoy's cards in order: a switch to show or hide each one and arrows to move it. */
export function HomeCardsList({ layout, onChange }: { layout: HomeLayout; onChange: (next: HomeLayout) => void }) {
  const last = layout.order.length - 1;
  return (
    <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
      {layout.order.map((k, i) => {
        const title = WIDGET_TITLES[k];
        const on = !layout.hidden.includes(k);
        return (
          <li key={k} className="flex items-center gap-2 px-3 py-1.5">
            <Switch label={`Mostrar ${title}`} checked={on} onChange={(v) => onChange(toggleWidget(layout, k, v))} />
            <span className={on ? "flex-1 text-[13.5px] text-text-primary" : "flex-1 text-[13.5px] text-text-muted"}>{title}</span>
            <button type="button" onClick={() => onChange(moveWidget(layout, k, -1))} disabled={i === 0} aria-label={`Subir ${title}`} className={arrowClass}>
              <ChevronUp aria-hidden className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onChange(moveWidget(layout, k, 1))} disabled={i === last} aria-label={`Bajar ${title}`} className={arrowClass}>
              <ChevronDown aria-hidden className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
