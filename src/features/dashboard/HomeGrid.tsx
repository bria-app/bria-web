"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EyeOff, GripVertical } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { usePageFlow } from "@/hooks/useDevicePref";
import { cn } from "@/lib/utils";
import type { ErpSummary } from "@/types/forecasting";
import { ActivityWidget } from "./ActivityWidget";
import { CajaWidget } from "./CajaWidget";
import { packWidgets, sizeWidget, toggleWidget, widgetSize, withVisibleOrder } from "./layout";
import { MonthWidget } from "./MonthWidget";
import { TodoWidget } from "./TodoWidget";
import { TopWidget } from "./TopWidget";
import type { TodayCash } from "./todayCash";
import { WIDGET_SIZES, WIDGET_SIZE_LABEL, WIDGET_TITLES, type ActivityItem, type HomeLayout, type TodoItem, type WidgetKey } from "./types";
import { useCardDrag } from "./useCardDrag";

interface Source<T> {
  data: T | null;
  error: string | null;
  reload: () => void;
}

interface Derived<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface HomeGridProps {
  layout: HomeLayout;
  /** Customizing: cards can be dragged, resized and hidden, and their insides don't react. */
  editing: boolean;
  onLayoutChange: (next: HomeLayout) => void;
  today: string;
  summary: Source<ErpSummary>;
  cash: Source<TodayCash>;
  todo: Derived<TodoItem>;
  activity: Derived<ActivityItem>;
  laterIds: string[];
  onLater: (id: string) => void;
  onShowLater: () => void;
}

/** The visible widgets, in the company's order. Each one loads and fails on its own. */
export function HomeGrid({ layout, editing, onLayoutChange, today, summary, cash, todo, activity, laterIds, onLater, onShowLater }: HomeGridProps) {
  const s = summary.data;
  const [pageFlow] = usePageFlow();
  const sideways = pageFlow === "lado";
  const grid = useRef<HTMLDivElement>(null);
  // The order while a card is being carried: saved only when it is let go.
  const [draft, setDraft] = useState<WidgetKey[] | null>(null);
  const saved = layout.order.filter((k) => !layout.hidden.includes(k));
  const visible = draft ?? saved;
  const { dragging, press } = useCardDrag<WidgetKey>({
    grid,
    order: visible,
    onPreview: setDraft,
    onDrop: (next) => {
      setDraft(null);
      if (next.join() !== saved.join()) onLayoutChange(withVisibleOrder(layout, next));
    },
    onCancel: () => setDraft(null),
  });
  const [said, setSaid] = useState("");

  // Cards moved around the page must not replay their entrance: it plays once, before any editing.
  const [arrived, setArrived] = useState(false);
  if (editing && !arrived) setArrived(true);

  /** Errors name the widget, since several can fail at once. */
  const named = (key: WidgetKey, error: string | null) => (error ? `${WIDGET_TITLES[key]}: ${error}` : null);
  const summaryState = (key: WidgetKey) => ({ loading: !s && !summary.error, error: named(key, summary.error), onRetry: summary.reload });

  const render = (key: WidgetKey, span: number): ReactNode => {
    switch (key) {
      case "caja":
        return (
          <DataState loading={!cash.data && !cash.error} error={named(key, cash.error)} onRetry={cash.reload}>
            {cash.data && <CajaWidget cash={cash.data} importedToday={s ? s.revenue_today - cash.data.total : 0} />}
          </DataState>
        );
      case "todo":
        return (
          <DataState loading={todo.loading} error={named(key, todo.error)} onRetry={todo.reload}>
            <TodoWidget items={todo.items} span={span} laterIds={laterIds} onLater={onLater} onShowLater={onShowLater} />
          </DataState>
        );
      case "top":
        return <DataState {...summaryState(key)}>{s && <TopWidget top={s.top_products} />}</DataState>;
      case "activity":
        return (
          <DataState loading={activity.loading} error={named(key, activity.error)} onRetry={activity.reload}>
            <ActivityWidget items={activity.items} today={today} />
          </DataState>
        );
      case "month":
        return <DataState {...summaryState(key)}>{s && <MonthWidget s={s} />}</DataState>;
    }
  };

  if (visible.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-text-secondary">
        Ocultaste todo. Usa «Personalizar» para volver a mostrar lo que quieras.
      </p>
    );
  }

  /** The arrow keys on a card's grip do what dragging does, a place at a time. */
  const moveWithKeys = (key: WidgetKey, e: KeyboardEvent) => {
    const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    const from = visible.indexOf(key);
    const to = from + dir;
    if (to < 0 || to >= visible.length) return;
    const next = [...visible];
    next.splice(from, 1);
    next.splice(to, 0, key);
    onLayoutChange(withVisibleOrder(layout, next));
    setSaid(`${WIDGET_TITLES[key]}: lugar ${to + 1} de ${visible.length}.`);
  };

  return (
    <div ref={grid} className={cn("home-grid", editing && "pb-24")}>
      {packWidgets(visible, layout.sizes).map(({ key, span }, i) => {
        const title = WIDGET_TITLES[key];
        const size = widgetSize(layout, key);
        return (
          <section
            key={key}
            aria-label={title}
            data-card={key}
            data-editing={editing ? "" : undefined}
            onPointerDown={editing ? (e) => press(key, e) : undefined}
            className={cn("relative flex min-w-0 flex-col", !editing && !arrived && "rise-in")}
            style={{ "--span": span, animationDelay: `${120 + i * 70}ms` } as React.CSSProperties}
          >
            <div inert={editing} className="flex min-w-0 flex-1 flex-col [&>*]:flex-1">
              {render(key, span)}
            </div>
            {editing && (
              <>
                <button
                  type="button"
                  data-grip
                  aria-label={`Mover ${title}. Usa las flechas.`}
                  aria-grabbed={dragging === key}
                  onKeyDown={(e) => moveWithKeys(key, e)}
                  className="absolute left-1 top-[1.15rem] grid h-7 w-5 touch-none cursor-grab place-items-center rounded-md text-text-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent-text"
                >
                  <GripVertical aria-hidden className="h-4 w-4" />
                </button>
                <div data-no-drag className="absolute right-3 top-3 flex cursor-default items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-soft">
                  {!sideways && (
                    <div role="group" aria-label={`Ancho de ${title}`} className="flex gap-0.5">
                      {WIDGET_SIZES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={size === option}
                          title={WIDGET_SIZE_LABEL[option].title}
                          onClick={() => onLayoutChange(sizeWidget(layout, key, option))}
                          className={cn(
                            "h-7 min-w-7 rounded-lg px-1.5 text-[13px] font-medium transition-colors",
                            size === option ? "bg-strong text-strong-foreground" : "text-text-secondary hover:bg-surface-soft hover:text-text-primary",
                          )}
                        >
                          {WIDGET_SIZE_LABEL[option].short}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-label={`Ocultar ${title}`}
                    title="Ocultar"
                    onClick={() => onLayoutChange(toggleWidget(layout, key, false))}
                    className="grid h-7 w-7 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-soft hover:text-text-primary"
                  >
                    <EyeOff aria-hidden className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}
      {editing && <div data-slot aria-hidden className="pointer-events-none absolute hidden rounded-2xl border-2 border-dashed border-accent-line bg-surface-soft" />}
      {editing && <p aria-live="polite" className="sr-only">
        {said}
      </p>}
    </div>
  );
}
