import { IGNORE, NEW_COLUMN, parseDate, parseNumber, type ImportRequirementGroup, type ImportTargetField, type MappingSuggestion } from "./parse";
import type { BuiltRow, Cell, NewCustomColumn } from "./types";

interface BuildInput {
  data: string[][];
  headers: string[];
  mapping: MappingSuggestion[];
  fieldByKey: Map<string, ImportTargetField>;
  newColumns: NewCustomColumn[];
  newColumnIdx: number[];
  /** Values typed once for a field no column has (already normalized). */
  constants: Record<string, string>;
  /** Groups with at least one mapped key: each row needs a value in one of them. */
  groups: ImportRequirementGroup[];
}

type Problem = { msg: string; short: string } | null;

/** Checks one raw value against its field type; returns the normalized value or the problem. */
export function readValue(rawValue: string, type: ImportTargetField["type"], label: string, required: boolean): { value: string; problem: Problem } {
  if (!rawValue) return { value: "", problem: required ? { msg: `${label}: falta el dato`, short: "Falta el dato" } : null };
  if (type === "number" || type === "integer") {
    const n = parseNumber(rawValue);
    if (n === null) return { value: "", problem: { msg: `${label}: «${rawValue}» no es un número. Escribe solo cifras, como 12.50`, short: "No es un número" } };
    if (type === "integer" && !Number.isInteger(n)) return { value: "", problem: { msg: `${label}: «${rawValue}» debe ser un número entero`, short: "Debe ser entero" } };
    return { value: String(n), problem: null };
  }
  if (type === "date") {
    const d = parseDate(rawValue);
    if (!d) return { value: "", problem: { msg: `${label}: «${rawValue}» no es una fecha. Usa día/mes/año, como 31/12/2026`, short: "No es una fecha" } };
    return { value: d, problem: null };
  }
  return { value: rawValue, problem: null };
}

/**
 * Normalizes every spreadsheet row against the current column mapping. Numbers and dates are
 * parsed; problems are tracked per cell so the grid can point at them. Only ROW problems are
 * reported here: a required field no column has is a file problem, handled by the caller.
 */
export function buildRows({ data, headers, mapping, fieldByKey, newColumns, newColumnIdx, constants, groups }: BuildInput): BuiltRow[] {
  const columnOf = new Map(mapping.map((m, i) => [m.target, i]));
  return data.map((raw, r) => {
    const values: Record<string, string> = { ...constants };
    const custom: Record<string, string> = {};
    const cells: Cell[] = [];
    const errors: string[] = [];
    mapping.forEach((m, i) => {
      const rawValue = (raw[i] ?? "").trim();
      cells[i] = { value: rawValue, bad: false };
      if (m.target === IGNORE) return;

      let type: ImportTargetField["type"] = "text";
      let label = headers[i] ?? "";
      let required = false;
      const newCol = m.target === NEW_COLUMN ? newColumns[newColumnIdx.indexOf(i)] : undefined;
      if (m.target === NEW_COLUMN) {
        type = newCol?.field_type ?? "text";
        label = newCol?.label ?? label;
      } else {
        const field = fieldByKey.get(m.target);
        if (!field) return;
        type = field.type ?? "text";
        label = field.label;
        required = !!field.required;
      }

      const { value, problem } = readValue(rawValue, type, label, required);
      if (problem) {
        errors.push(problem.msg);
        cells[i] = { value: rawValue, bad: true, msg: problem.msg, short: problem.short, label };
        return;
      }
      if (!value) return;
      if (newCol) custom[newCol.key] = value;
      else if (m.target.startsWith("custom:")) custom[m.target.slice(7)] = value;
      else values[m.target] = value;
    });

    // «Código, código de barras o nombre»: one of the mapped columns must have something.
    for (const g of groups) {
      if (g.keys.some((k) => values[k])) continue;
      const cols = g.keys.map((k) => columnOf.get(k)).filter((c): c is number => c !== undefined);
      // A cell already marked (e.g. a bad barcode) explains the row; otherwise mark the gap.
      if (cols.some((c) => cells[c]?.bad)) continue;
      const msg = `${g.label}: falta ${g.hint}`;
      errors.push(msg);
      cols.forEach((c, n) => {
        cells[c] = { ...cells[c], bad: true, short: "Falta el dato", label: g.label, msg: n === 0 ? msg : undefined };
      });
    }
    return { index: r, row: { rowNumber: r + 1, values, custom }, errors, cells };
  });
}
