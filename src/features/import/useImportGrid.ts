"use client";

import { useMemo, useState } from "react";
import { IGNORE, NEW_COLUMN, autoMap, inferType, slugify, type ImportRequirementGroup, type ImportTargetField, type MappingSuggestion, type ParsedSheet } from "./parse";
import { buildRows, readValue } from "./buildRows";
import type { AppliedFills, ErrorGroup, FieldFill, FileGap, GridFilter, NewCustomColumn } from "./types";

const PAGE = 150;
const NO_GROUPS: ImportRequirementGroup[] = [];

/** State of the editable import preview: mapping, edits, removed rows, filters and problems. */
export function useImportGrid(targetFields: ImportTargetField[], allowNewColumns: boolean, requireOneOf: ImportRequirementGroup[] = NO_GROUPS) {
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [data, setData] = useState<string[][]>([]);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [mapping, setMapping] = useState<MappingSuggestion[]>([]);
  const [newLabels, setNewLabels] = useState<Record<number, string>>({});
  const [newTypes, setNewTypes] = useState<Record<number, NewCustomColumn["field_type"]>>({});
  const [fills, setFills] = useState<Record<string, FieldFill>>({});
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilterState] = useState<GridFilter>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const headers = useMemo(() => sheet?.headers ?? [], [sheet]);
  const fieldByKey = useMemo(() => new Map(targetFields.map((t) => [t.key, t])), [targetFields]);

  const { newColumns, newColumnIdx } = useMemo(() => {
    const idx = mapping.map((m, i) => (m.target === NEW_COLUMN ? i : -1)).filter((i) => i >= 0);
    const cols = idx.map((i) => {
      const label = (newLabels[i] ?? headers[i] ?? "").trim() || `Columna ${i + 1}`;
      return { key: slugify(label), label, field_type: newTypes[i] ?? inferType(data.map((r) => r[i] ?? "")) };
    });
    return { newColumns: cols, newColumnIdx: idx };
  }, [mapping, newLabels, newTypes, data, headers]);

  // File problems: required fields (and «one of» groups) that no column feeds.
  const { fileGaps, constants, applied, activeGroups } = useMemo(() => {
    const mapped = new Set(mapping.map((m) => m.target));
    const gaps: FileGap[] = [];
    const constantValues: Record<string, string> = {};
    const appliedFills: AppliedFills = {};
    for (const t of targetFields) {
      if (!t.required || mapped.has(t.key)) continue;
      const fill = fills[t.key];
      let fillError: string | undefined;
      let resolved = false;
      if (fill?.mode === "later" && t.later) {
        resolved = true;
        appliedFills[t.key] = { mode: "later" };
      } else if (fill?.mode === "constant" && t.constant && fill.raw.trim()) {
        const { value, problem } = readValue(fill.raw.trim(), t.type, t.label, true);
        if (problem) fillError = problem.short;
        else {
          resolved = true;
          constantValues[t.key] = value;
          appliedFills[t.key] = { mode: "constant", value };
        }
      }
      gaps.push({
        id: t.key,
        kind: "field",
        label: t.label,
        question: t.question ?? `¿Qué columna es «${t.label}»?`,
        keys: [{ key: t.key, label: t.label }],
        constant: t.constant ? { ...t.constant, type: t.type ?? "text" } : undefined,
        later: t.later,
        fill,
        fillError,
        blocking: !resolved,
      });
    }
    const groups = requireOneOf.filter((g) => g.keys.some((k) => mapped.has(k)));
    for (const g of requireOneOf) {
      if (groups.includes(g)) continue;
      gaps.push({
        id: `group:${g.id}`,
        kind: "group",
        label: g.label,
        question: g.question,
        keys: g.keys.map((k) => ({ key: k, label: fieldByKey.get(k)?.label ?? k })),
        blocking: true,
      });
    }
    return { fileGaps: gaps, constants: constantValues, applied: appliedFills, activeGroups: groups };
  }, [targetFields, mapping, fills, requireOneOf, fieldByKey]);

  const built = useMemo(
    () => buildRows({ data, headers, mapping, fieldByKey, newColumns, newColumnIdx, constants, groups: activeGroups }),
    [data, headers, mapping, fieldByKey, newColumns, newColumnIdx, constants, activeGroups],
  );
  const active = useMemo(() => built.filter((b) => !removed.has(b.index)), [built, removed]);
  const validCount = active.filter((b) => b.errors.length === 0).length;
  const rowsEdited = useMemo(() => new Set([...edited].map((k) => Number(k.split(":")[0]))), [edited]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((b) => {
      if (filter === "errors" && b.errors.length === 0) return false;
      if (filter === "edited" && !rowsEdited.has(b.index)) return false;
      return !q || b.cells.some((c) => c?.value.toLowerCase().includes(q));
    });
  }, [active, filter, query, rowsEdited]);

  // «Precio de venta · No es un número · 3 filas»: what is wrong, by column, most frequent first.
  const errorGroups = useMemo(() => {
    const byKey = new Map<string, ErrorGroup>();
    for (const b of active) {
      b.cells.forEach((cell, c) => {
        if (!cell?.bad || !cell.msg) return;
        const key = `${c}:${cell.short}`;
        const g = byKey.get(key);
        if (g) g.count += 1;
        else byKey.set(key, { c, label: cell.label ?? headers[c] ?? "", short: cell.short ?? "Revisar", count: 1, first: b.index });
      });
    }
    return [...byKey.values()].sort((a, b) => b.count - a.count);
  }, [active, headers]);

  /** One value per column (the first filled one), so pickers can show what a column holds. */
  const samples = useMemo(() => headers.map((_, i) => data.find((r) => (r[i] ?? "").trim())?.[i]?.trim() ?? ""), [headers, data]);

  const load = (parsed: ParsedSheet) => {
    setSheet(parsed);
    setData(parsed.rows.map((r) => [...r]));
    setMapping(autoMap(parsed.headers, targetFields, allowNewColumns));
    setNewLabels(Object.fromEntries(parsed.headers.map((h, i) => [i, h])));
    setNewTypes({});
    setFills({});
    setRemoved(new Set());
    setEdited(new Set());
    setEditing(null);
    setFilterState("all");
    setQuery("");
    setLimit(PAGE);
  };

  const clear = () => {
    setSheet(null);
    setData([]);
    setMapping([]);
    setFills({});
    setEditing(null);
  };

  const startEdit = (r: number, c: number) => {
    if (mapping[c]?.target === IGNORE) return;
    setEditing({ r, c });
    setDraft(data[r]?.[c] ?? "");
  };

  const commit = (move?: "down" | "right") => {
    if (!editing) return;
    const { r, c } = editing;
    if ((data[r]?.[c] ?? "") !== draft) {
      setData((prev) => prev.map((row, i) => (i === r ? row.map((v, j) => (j === c ? draft : v)) : row)));
      setEdited((prev) => new Set(prev).add(`${r}:${c}`));
    }
    if (!move) return setEditing(null);
    if (move === "down") {
      const next = visibleRows[visibleRows.findIndex((b) => b.index === r) + 1];
      return next ? startEdit(next.index, c) : setEditing(null);
    }
    let nc = c + 1;
    while (nc < headers.length && mapping[nc]?.target === IGNORE) nc++;
    return nc < headers.length ? startEdit(r, nc) : setEditing(null);
  };

  const jumpTo = (r: number, c: number) => {
    setQuery("");
    // Stay on «Con errores» when the row is one of them; otherwise show every row.
    const row = active.find((b) => b.index === r);
    const keepErrors = filter === "errors" && !!row && row.errors.length > 0;
    if (!keepErrors) setFilterState("all");
    const list = keepErrors ? active.filter((b) => b.errors.length > 0) : active;
    const pos = list.findIndex((b) => b.index === r);
    if (pos >= limit) setLimit(Math.ceil((pos + 1) / PAGE) * PAGE);
    startEdit(r, c);
  };

  const restore = () => {
    if (!sheet) return;
    setData(sheet.rows.map((r) => [...r]));
    setRemoved(new Set());
    setEdited(new Set());
    setEditing(null);
  };

  const setTarget = (i: number, target: string) => setMapping((prev) => prev.map((x, j) => (j === i ? { target, confidence: null } : x)));

  return {
    sheet,
    headers,
    mapping,
    newLabels,
    newTypes,
    newColumns,
    newColumnIdx,
    fileGaps,
    blockingGaps: fileGaps.filter((g) => g.blocking),
    appliedFills: applied,
    samples,
    fieldLabel: (key: string) => fieldByKey.get(key)?.label ?? key,
    active,
    validCount,
    invalidCount: active.length - validCount,
    rowsEdited,
    removedCount: removed.size,
    editedCount: edited.size,
    edited,
    visibleRows,
    errorGroups,
    editing,
    draft,
    filter,
    query,
    limit,
    load,
    clear,
    restore,
    startEdit,
    commit,
    jumpTo,
    cancelEdit: () => setEditing(null),
    setDraft,
    setFilter: setFilterState,
    setQuery,
    showMore: () => setLimit((l) => l + PAGE),
    removeRow: (index: number) => setRemoved((prev) => new Set(prev).add(index)),
    setTarget,
    setFill: (key: string, fill: FieldFill | null) =>
      setFills((prev) => {
        const next = { ...prev };
        if (fill) next[key] = fill;
        else delete next[key];
        return next;
      }),
    setNewLabel: (i: number, label: string) => setNewLabels((p) => ({ ...p, [i]: label })),
    setNewType: (i: number, type: NewCustomColumn["field_type"]) => setNewTypes((p) => ({ ...p, [i]: type })),
  };
}

export type ImportGridState = ReturnType<typeof useImportGrid>;
