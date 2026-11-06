"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { customFieldsApi, preferencesApi } from "@/services/api/custom-fields";
import type { CategoryDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { BUILTIN_COLUMNS, DEFAULT_HIDDEN, customColumn, customKey, type CatalogColumn } from "./catalogColumns";

/**
 * Stored under the company preference `columns:product` (shared by the whole team).
 * `v: 2` marks the inventory table's own format: built-in columns hidden plus the order of every
 * configurable column. Older values (`{hidden}` only, from the previous table) are ignored
 * so everyone starts from the new defaults. Own fields are shown or hidden through their
 * definition (`is_visible`), the same flag every other screen reads.
 */
interface ColumnPref {
  v: 2;
  hidden: string[];
  order: string[];
}

const PREF_KEY = "columns:product";
const FIXED_COLUMNS = BUILTIN_COLUMNS.filter((c) => c.fixed);
const DEFAULT_PREF: ColumnPref = { v: 2, hidden: DEFAULT_HIDDEN, order: [] };

function parsePref(value: unknown): ColumnPref {
  if (value && typeof value === "object" && (value as { v?: unknown }).v === 2) {
    const raw = value as { hidden?: unknown; order?: unknown };
    const strings = (x: unknown) => (Array.isArray(x) ? x.filter((k): k is string => typeof k === "string") : []);
    return { v: 2, hidden: strings(raw.hidden), order: strings(raw.order) };
  }
  return DEFAULT_PREF;
}

export interface ColumnSetting {
  column: CatalogColumn;
  visible: boolean;
  /** Can move left (up) / right (down) among visible configurable columns. */
  canUp: boolean;
  canDown: boolean;
}

export function useCatalogColumns(companyId: string | null, categories: CategoryDTO[]) {
  const fieldsQ = useApi(
    () => (companyId ? customFieldsApi.list(companyId, "product") : Promise.resolve([] as CustomFieldDTO[])),
    [companyId],
  );
  const [pref, setPref] = useState<ColumnPref>(DEFAULT_PREF);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    preferencesApi
      .get(companyId, PREF_KEY)
      .then((res) => alive && setPref(parsePref(res.value)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [companyId]);

  const fields = useMemo(() => fieldsQ.data ?? [], [fieldsQ.data]);

  const save = useCallback(
    (next: ColumnPref) => {
      setPref(next);
      setSaveError(null);
      if (!companyId) return;
      preferencesApi.put(companyId, PREF_KEY, next).catch(() => setSaveError("No pudimos guardar el orden de columnas. Inténtalo de nuevo."));
    },
    [companyId],
  );

  const configurable = useMemo(() => {
    const all = [...BUILTIN_COLUMNS.filter((c) => !c.fixed), ...fields.map((f) => customColumn(f, categories))];
    const byKey = new Map(all.map((c) => [c.key, c]));
    return [
      ...pref.order.filter((k) => byKey.has(k)),
      ...all.map((c) => c.key).filter((k) => !pref.order.includes(k)),
    ].map((k) => byKey.get(k) as CatalogColumn);
  }, [fields, categories, pref.order]);

  const fieldByKey = useMemo(() => new Map(fields.map((f) => [customKey(f), f])), [fields]);
  const isVisible = useCallback(
    (c: CatalogColumn) => (c.origin === "propio" ? fieldByKey.get(c.key)?.is_visible ?? false : !pref.hidden.includes(c.key)),
    [fieldByKey, pref.hidden],
  );

  // Stable between renders, so the page's filtering and sorting only rerun when columns change.
  const columns = useMemo(() => [...FIXED_COLUMNS, ...configurable.filter(isVisible)], [configurable, isVisible]);
  const visibleKeys = useMemo(() => columns.filter((c) => !c.fixed).map((c) => c.key), [columns]);
  const settings: ColumnSetting[] = configurable.map((column) => {
    const i = visibleKeys.indexOf(column.key);
    return { column, visible: i >= 0, canUp: i > 0, canDown: i >= 0 && i < visibleKeys.length - 1 };
  });

  const toggle = async (column: CatalogColumn) => {
    const field = fieldByKey.get(column.key);
    if (field) {
      if (!companyId) return;
      await customFieldsApi.update(companyId, field.id, { is_visible: !field.is_visible });
      fieldsQ.reload();
      return;
    }
    const hidden = pref.hidden.includes(column.key) ? pref.hidden.filter((k) => k !== column.key) : [...pref.hidden, column.key];
    save({ ...pref, hidden });
  };

  /** Swaps a visible column with its visible neighbour; hidden ones keep their place. */
  const move = (key: string, dir: -1 | 1) => {
    const neighbour = visibleKeys[visibleKeys.indexOf(key) + dir];
    if (!neighbour) return;
    const order = configurable.map((c) => c.key);
    const a = order.indexOf(key);
    const b = order.indexOf(neighbour);
    [order[a], order[b]] = [order[b], order[a]];
    save({ ...pref, order });
  };

  const reset = () => save(DEFAULT_PREF);

  return {
    fields,
    reloadFields: fieldsQ.reload,
    columns,
    fixed: FIXED_COLUMNS,
    settings,
    toggle,
    move,
    reset,
    saveError,
  };
}
