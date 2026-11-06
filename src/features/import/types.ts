export interface ImportRow {
  /** 1-based row number as seen in the user's spreadsheet (after the header). */
  rowNumber: number;
  /** Values for built-in targets, normalized: numbers as "12.5", dates as "yyyy-mm-dd". */
  values: Record<string, string>;
  /** Values for custom columns, keyed by custom field key (existing or newly created). */
  custom: Record<string, string>;
}

export interface NewCustomColumn {
  key: string;
  label: string;
  field_type: "text" | "number" | "date";
}

export interface ImportResult {
  created: number;
  updated?: number;
  skipped?: number;
  errors: { row: number; message: string }[];
  /** Optional extra lines shown on the result screen. */
  notes?: string[];
}

/**
 * How a required field that no column has gets its value: one typed value for every row
 * («constant», raw text as typed) or left for later («later», the importer decides).
 */
export type FieldFill = { mode: "constant"; raw: string } | { mode: "later" };

/** Normalized fills handed to `onImport`: the value every row took, or «later». */
export type AppliedFills = Record<string, { mode: "constant"; value: string } | { mode: "later" }>;

/**
 * A cell as shown in the grid. `bad` cells carry `msg` (full sentence, for lists and screen
 * readers) and `short` (two or three words shown under the value).
 */
export type Cell = { value: string; bad: boolean; msg?: string; short?: string; label?: string };
export type BuiltRow = { index: number; row: ImportRow; errors: string[]; cells: Cell[] };
export type GridFilter = "all" | "errors" | "edited";

/** Something the file as a whole lacks (not one row): a required field no column has. */
export interface FileGap {
  id: string;
  kind: "field" | "group";
  label: string;
  question: string;
  /** Field keys a picked column can become (one for a field, several for a group). */
  keys: { key: string; label: string }[];
  /** Fill options and the current fill (fields only). */
  constant?: { label: string; hint?: string; type: "text" | "number" | "integer" | "date" };
  later?: { label: string; hint?: string };
  fill?: FieldFill;
  /** The typed constant does not parse (e.g. «abc» as a price). */
  fillError?: string;
  /** Still blocks the import: no column, no valid fill. */
  blocking: boolean;
}

/** Row problems grouped by column and reason, for the summary («Precio: no es un número ×3»). */
export interface ErrorGroup {
  c: number;
  label: string;
  short: string;
  count: number;
  first: number;
}
