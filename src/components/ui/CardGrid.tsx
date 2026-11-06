"use client";

import type { ReactNode } from "react";
import { usePageFlow } from "@/hooks/useDevicePref";

interface CardGridProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** Accessible name, e.g. «Productos». */
  label: string;
  /** Narrowest a card gets, px. As many as fit share the whole width, so they end on the page's edge. */
  minCard?: number;
}

/**
 * A list as cards, going the way the page goes. Going down, as many columns as fit and every row
 * as tall as the tallest, so the cards line up both ways. Going sideways, the cards are simply
 * listed: the page lays them out in its own columns (see `sidewaysLayout`).
 */
export function CardGrid<T>({ items, getKey, renderCard, label, minCard = 260 }: CardGridProps<T>) {
  const [pageFlow] = usePageFlow();
  const down = pageFlow === "abajo";
  return (
    <div
      role="region"
      aria-label={label}
      data-sw-cards={down ? undefined : ""}
      className={down ? "grid auto-rows-fr gap-3" : "grid gap-3"}
      style={down ? { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minCard}px), 1fr))` } : undefined}
    >
      {items.map((item) => (
        <div key={getKey(item)} className="list-card min-w-0">
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}
