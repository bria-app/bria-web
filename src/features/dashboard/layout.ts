import { DEFAULT_WIDGET_SIZE, WIDGET_KEYS, WIDGET_SIZES, type HomeLayout, type LaterState, type WidgetKey, type WidgetSize } from "./types";

export const LAYOUT_KEY = "home-layout";
export const LATER_KEY = "home-later";

const GRID = 12;

const isWidgetKey = (v: unknown): v is WidgetKey => typeof v === "string" && (WIDGET_KEYS as readonly string[]).includes(v);

const record = (raw: unknown): Record<string, unknown> | null =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;

/** Whatever is stored becomes a full, valid layout: unknown keys dropped, new widgets appended. */
export function parseLayout(raw: unknown): HomeLayout {
  const r = record(raw);
  const stored = Array.isArray(r?.order) ? r.order.filter(isWidgetKey) : [];
  const order = [...new Set(stored)];
  for (const k of WIDGET_KEYS) if (!order.includes(k)) order.push(k);
  const hidden = Array.isArray(r?.hidden) ? [...new Set(r.hidden.filter(isWidgetKey))] : [];
  const sizes: HomeLayout["sizes"] = {};
  const storedSizes = record(r?.sizes);
  for (const k of WIDGET_KEYS) {
    const v = storedSizes?.[k];
    if ((WIDGET_SIZES as readonly unknown[]).includes(v)) sizes[k] = v as WidgetSize;
  }
  return { order, hidden, sizes };
}

/** Moves a widget one place up (-1) or down (+1). */
export function moveWidget(layout: HomeLayout, key: WidgetKey, dir: -1 | 1): HomeLayout {
  const order = [...layout.order];
  const i = order.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return layout;
  [order[i], order[j]] = [order[j], order[i]];
  return { ...layout, order };
}

export function toggleWidget(layout: HomeLayout, key: WidgetKey, visible: boolean): HomeLayout {
  const hidden = layout.hidden.filter((k) => k !== key);
  return { ...layout, hidden: visible ? hidden : [...hidden, key] };
}

export function sizeWidget(layout: HomeLayout, key: WidgetKey, size: WidgetSize): HomeLayout {
  return { ...layout, sizes: { ...layout.sizes, [key]: size } };
}

/** The visible cards in a new order; hidden ones keep their turn at the end until shown again. */
export function withVisibleOrder(layout: HomeLayout, visible: WidgetKey[]): HomeLayout {
  return { ...layout, order: [...visible, ...layout.order.filter((k) => !visible.includes(k))] };
}

export const widgetSize = (layout: Pick<HomeLayout, "sizes">, key: WidgetKey): WidgetSize => layout.sizes?.[key] ?? DEFAULT_WIDGET_SIZE[key];

/** `sizes` shared out over the whole 12 columns, keeping their proportions as well as whole columns allow. */
function fill(sizes: number[]): number[] {
  const sum = sizes.reduce((a, b) => a + b, 0);
  if (sum === GRID) return sizes;
  const exact = sizes.map((s) => (s * GRID) / sum);
  const spans = exact.map(Math.floor);
  let left = GRID - spans.reduce((a, b) => a + b, 0);
  const byRest = exact.map((e, i) => ({ i, rest: e - Math.floor(e) })).sort((a, b) => b.rest - a.rest);
  for (const { i } of byRest) {
    if (left-- <= 0) break;
    spans[i] += 1;
  }
  return spans;
}

/**
 * Columns each card takes. Cards go in rows in their order, as many as their sizes allow, and every
 * row is then stretched to the full width: whatever the person arranges, no row ends short and
 * every row starts and ends on the same lines.
 */
export function packWidgets(keys: WidgetKey[], sizes: HomeLayout["sizes"]): { key: WidgetKey; span: number }[] {
  const rows: WidgetKey[][] = [];
  let used = GRID;
  for (const key of keys) {
    const size = widgetSize({ sizes }, key);
    if (used + size > GRID) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(key);
    used += size;
  }
  return rows.flatMap((row) => {
    const spans = fill(row.map((key) => widgetSize({ sizes }, key)));
    return row.map((key, i) => ({ key, span: spans[i] }));
  });
}

/** The «para luego» list only counts on the day it was made. */
export function parseLater(raw: unknown, today: string | null): LaterState {
  const r = record(raw);
  const ids = Array.isArray(r?.ids) ? r.ids.filter((v): v is string => typeof v === "string") : [];
  return today && r?.date === today ? { date: today, ids } : { date: today ?? "", ids: [] };
}
