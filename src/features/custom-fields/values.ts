import { formatNumber, soles } from "@/lib/format";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";

type Value = CustomAttributes[string] | undefined;

/**
 * A yes/no value as stored. Spreadsheet imports keep the cell text («Sí», «no», «x»), so
 * text answers count too; null when it is neither.
 */
export function asBoolean(value: Value): boolean | null {
  if (typeof value === "boolean") return value;
  const s = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  if (["true", "si", "s", "1", "x", "yes"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  return null;
}

/** A custom value as text for a table cell or a read-only sheet. */
export function formatCustomValue(field: Pick<CustomFieldDTO, "field_type">, value: Value): string {
  if (value == null || value === "") return "—";
  switch (field.field_type) {
    case "boolean": {
      const b = asBoolean(value);
      return b === null ? String(value) : b ? "Sí" : "No";
    }
    case "currency":
      return soles(Number(value));
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? formatNumber(n, Number.isInteger(n) ? 0 : 2) : String(value);
    }
    case "date": {
      const s = String(value);
      return /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : s;
    }
    default:
      return String(value);
  }
}
