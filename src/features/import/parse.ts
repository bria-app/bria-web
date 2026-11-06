/**
 * Smart imports: target fields, header auto-mapping, and (re-exported) spreadsheet reading
 * and value parsing, so importers keep a single entry point.
 */

export { readSpreadsheet, type ParsedSheet } from "./read";
export { inferType, parseDate, parseNumber } from "./values";

export type ImportFieldType = "text" | "number" | "integer" | "date";

export interface ImportTargetField {
  key: string;
  label: string;
  required?: boolean;
  /** Other header spellings that should map here ("cant", "qty", "unidades"...). */
  synonyms?: string[];
  type?: ImportFieldType;
  hint?: string;
  /** Asked when no column of the file has this field: «¿Qué columna es el precio de venta?». */
  question?: string;
  /** When no column has it, one typed value can fill every row («Mismo precio para todos»). */
  constant?: { label: string; hint?: string };
  /** When no column has it, it can be left for later (the importer decides what that means). */
  later?: { label: string; hint?: string };
}

/** At least one of these fields must come from a column (e.g. código, código de barras o nombre). */
export interface ImportRequirementGroup {
  id: string;
  keys: string[];
  /** Short name of what is missing: «Producto». */
  label: string;
  /** What fills it, for the row message: «el código, el código de barras o el nombre». */
  hint: string;
  question: string;
}

export const IGNORE = "__ignore";
export const NEW_COLUMN = "__new";

/** Same algorithm as the backend's custom_fields.slugify — keys must match. */
export function slugify(label: string): string {
  const ascii = label.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
  const slug = ascii.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return (slug || "campo").slice(0, 60);
}

function normalizeHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ─── Auto-mapping ───────────────────────────────────────────────────────────

export interface MappingSuggestion {
  target: string; // field key, IGNORE or NEW_COLUMN
  confidence: "alta" | "media" | "baja" | null;
}

export function autoMap(
  headers: string[],
  targets: ImportTargetField[],
  allowNewColumns: boolean,
): MappingSuggestion[] {
  const scored: { h: number; key: string; score: number }[] = [];
  headers.forEach((header, h) => {
    const nh = normalizeHeader(header);
    if (!nh) return;
    targets.forEach((t) => {
      const names = [t.key.replace(/^custom:/, "").replace(/_/g, " "), t.label, ...(t.synonyms ?? [])].map(normalizeHeader);
      let score = 0;
      for (const n of names) {
        if (!n) continue;
        if (n === nh) score = Math.max(score, 100);
        else if (n.length >= 3 && (nh.includes(n) || n.includes(nh))) score = Math.max(score, 70);
        else {
          const a = new Set(nh.split(" "));
          const overlap = n.split(" ").filter((w) => w.length > 2 && a.has(w)).length;
          if (overlap) score = Math.max(score, 40 + overlap * 10);
        }
      }
      if (score > 0) scored.push({ h, key: t.key, score });
    });
  });

  scored.sort((a, b) => b.score - a.score);
  const result: MappingSuggestion[] = headers.map(() => ({
    target: allowNewColumns ? NEW_COLUMN : IGNORE,
    confidence: null,
  }));
  const usedHeaders = new Set<number>();
  const usedTargets = new Set<string>();
  for (const s of scored) {
    if (usedHeaders.has(s.h) || usedTargets.has(s.key) || s.score < 50) continue;
    usedHeaders.add(s.h);
    usedTargets.add(s.key);
    result[s.h] = { target: s.key, confidence: s.score >= 100 ? "alta" : s.score >= 70 ? "media" : "baja" };
  }
  return result;
}
