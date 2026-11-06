import type { BadgeTone } from "@/components/ui/Badge";

/** Widgets of the home screen, in their default order. */
export const WIDGET_KEYS = ["caja", "todo", "top", "activity", "month"] as const;
export type WidgetKey = (typeof WIDGET_KEYS)[number];

export const WIDGET_TITLES: Record<WidgetKey, string> = {
  caja: "Caja de hoy",
  todo: "Para hoy",
  top: "Lo que más sale",
  activity: "Actividad",
  month: "Tu mes",
};

/** How wide a card asks to be, in columns of 12. A row then stretches to fill the width (`packWidgets`). */
export const WIDGET_SIZES = [4, 6, 8, 12] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const WIDGET_SIZE_LABEL: Record<WidgetSize, { short: string; title: string }> = {
  4: { short: "⅓", title: "Un tercio del ancho" },
  6: { short: "½", title: "La mitad del ancho" },
  8: { short: "⅔", title: "Dos tercios del ancho" },
  12: { short: "1", title: "Todo el ancho" },
};

/** By default everything falls on thirds: the right edges of one row line up with the next. */
export const DEFAULT_WIDGET_SIZE: Record<WidgetKey, WidgetSize> = { caja: 8, todo: 4, top: 4, activity: 4, month: 4 };

/** Stored per company under the `home-layout` preference. */
export interface HomeLayout {
  order: WidgetKey[];
  hidden: WidgetKey[];
  /** Only what the person changed; the rest follow `DEFAULT_WIDGET_SIZE`. */
  sizes?: Partial<Record<WidgetKey, WidgetSize>>;
}

/** Items the owner left «para luego». Only valid for the Lima date it was saved on. */
export interface LaterState {
  date: string;
  ids: string[];
}

export interface TodoItem {
  id: string;
  pill: string;
  tone: BadgeTone;
  title: string;
  why: string;
  productHref: string;
  cta: { label: string; href: string };
}

export type ActivityKind = "sale" | "voided" | "purchase" | "adjustment";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  text: string;
  /** Money or quantity, shown in mono. */
  amount: string;
  at: string;
  href: string;
}
