/** Reading numbers and dates the way Peruvian spreadsheets write them. */

/** "S/ 1.234,50", "1,234.50", "12,5", "$99" → number. Null when it isn't a number. */
export function parseNumber(input: string | number | null | undefined): number | null {
  if (input == null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = input.trim().replace(/^(s\/\.?|pen|usd|us\$|\$)\s*/i, "").replace(/\s/g, "");
  if (!s || !/^-?[\d.,]+$/.test(s)) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** ISO yyyy-mm-dd, dd/mm/yyyy (Peru), dd-mm-yy, Excel serial → "yyyy-mm-dd". */
export function parseDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(s);
  if (m) {
    let year = +m[3];
    if (year < 100) year += 2000;
    let day = +m[1];
    let month = +m[2];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    return iso(year, month, day);
  }
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    if (serial > 20000 && serial < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Guess a column's type from sample values (for auto-created custom columns). */
export function inferType(values: string[]): "text" | "number" | "date" {
  const filled = values.filter((v) => v.trim()).slice(0, 30);
  if (filled.length === 0) return "text";
  if (filled.every((v) => parseNumber(v) !== null)) return "number";
  if (filled.every((v) => parseDate(v) !== null)) return "date";
  return "text";
}
