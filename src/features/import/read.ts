/**
 * Reads a spreadsheet file into a header row and data rows.
 *
 * Accepts CSV/TXT (any delimiter, UTF-8 or Windows-1252 as exported by Excel in Spanish
 * locales) and XLSX/XLS/ODS (the `xlsx` library loads only when such a file is picked). Finds
 * the real header row even when the file has a title block above it.
 */
import { parseNumber } from "./values";

export interface ParsedSheet {
  headers: string[];
  rows: string[][];
  sheetName?: string;
}

export async function readSpreadsheet(file: File): Promise<ParsedSheet> {
  const name = file.name.toLowerCase();
  let matrix: string[][];
  let sheetName: string | undefined;

  if (/\.(xlsx|xlsm|xls|ods)$/.test(name)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    sheetName = wb.SheetNames[0];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, raw: true, defval: "" });
    matrix = raw.map((r) => r.map(cellToString));
  } else {
    const buf = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buf);
    matrix = parseDelimited(text.replace(/^﻿/, ""));
  }

  matrix = matrix.filter((r) => r.some((c) => c.trim() !== ""));
  if (matrix.length === 0) return { headers: [], rows: [], sheetName };

  const headerIdx = detectHeaderRow(matrix);
  const width = Math.max(...matrix.slice(headerIdx).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => (matrix[headerIdx][i] ?? "").trim() || `Columna ${i + 1}`);
  // Drop columns that are empty in the header AND every row.
  const keep = headers.map((h, i) => !h.startsWith("Columna ") || matrix.slice(headerIdx + 1).some((r) => (r[i] ?? "").trim()));
  const rows = matrix
    .slice(headerIdx + 1)
    .map((r) => headers.map((_, i) => (r[i] ?? "").trim()).filter((_, i) => keep[i]));
  return { headers: headers.filter((_, i) => keep[i]), rows, sheetName };
}

function cellToString(v: unknown): string {
  if (v instanceof Date) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  return v == null ? "" : String(v).trim();
}

function detectDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 8);
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestScore = -1;
  for (const d of candidates) {
    const counts = sample.map((line) => line.split(d).length - 1).filter((c) => c > 0);
    if (counts.length === 0) continue;
    // Prefer delimiters that appear consistently across lines.
    const consistency = counts.filter((c) => c === counts[0]).length;
    const score = consistency * 10 + counts[0];
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

function parseDelimited(text: string): string[][] {
  const delim = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim()));
}

/** The header is the first row that is "wide" and mostly non-numeric text. */
function detectHeaderRow(matrix: string[][]): number {
  const maxWidth = Math.max(...matrix.slice(0, 15).map((r) => r.filter((c) => c).length));
  for (let i = 0; i < Math.min(10, matrix.length); i++) {
    const filled = matrix[i].filter((c) => c.trim());
    const textual = filled.filter((c) => parseNumber(c) === null).length;
    if (filled.length >= Math.max(2, Math.ceil(maxWidth * 0.6)) && textual >= filled.length * 0.6) return i;
  }
  return 0;
}
