/**
 * Advanced rules of an own column, as the API applies them (custom_fields/domain/rules.py):
 * value checks on save and the alert that marks a product. The web mirrors them so the form
 * can say what is wrong before saving, and the catalog can mark rows the overview does not.
 * Every function is pure: «today» (a Lima date, YYYY-MM-DD) is always passed in.
 */
import { limaDate, shiftDate } from "@/lib/lima";
import { formatNumber, soles } from "@/lib/format";
import type { CategoryDTO } from "@/types/api";
import type {
  AlertOp,
  CustomAttributes,
  CustomFieldAlert,
  CustomFieldDTO,
  CustomFieldType,
  CustomFieldValidation,
  ProductAlert,
} from "@/types/custom-fields";
import { asBoolean } from "./values";
import { fieldAppliesTo } from "./scope";

type Value = CustomAttributes[string] | undefined;

export const MAX_TEXT_LENGTH = 1000;
export const MAX_ALERT_DAYS = 3650;
export const MAX_ALERT_LABEL = 40;
export const MAX_ALERT_TEXT = 120;

/** The shop's calendar day, as the API counts it. */
export const limaToday = () => limaDate(new Date());

/** Which alert conditions each column type accepts, in the order they are offered. */
export const ALERT_OPS: Record<CustomFieldType, AlertOp[]> = {
  number: ["lt", "lte", "gt", "gte", "eq", "empty"],
  currency: ["lt", "lte", "gt", "gte", "eq", "empty"],
  date: ["within_days", "past", "empty"],
  select: ["eq", "empty"],
  boolean: ["eq", "empty"],
  text: ["eq", "empty"],
  url: ["empty"],
};

export const isEmptyValue = (v: Value) => v == null || (typeof v === "string" && v.trim() === "");
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const isNumeric = (t: CustomFieldType) => t === "number" || t === "currency";

/** A typed number («12,5» counts as 12.5, like the API); null when it is not one. */
export function parseNumber(v: Value): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || !v.trim()) return null;
  const s = v.trim().replace(/^S\/\s*/i, "").replace(/\s/g, "");
  const normal = /^-?\d+,\d+$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  const n = Number(normal);
  return normal !== "" && Number.isFinite(n) ? n : null;
}

/** «2026-12-31» from an ISO date or a «31/12/2026» cell; null otherwise. */
export function parseIsoDate(v: Value): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  return dmy ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}` : null;
}

const decimalPlaces = (n: number) => {
  const text = String(n);
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.includes(".") ? text.split(".")[1].length : 0;
};

/** «S/ 100» or «100», as the API writes limits in its messages. */
export const ruleNumber = (n: number, type: CustomFieldType) =>
  type === "currency" ? soles(n) : formatNumber(n, Number.isInteger(n) ? 0 : Math.min(decimalPlaces(n), 6));

const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * What is wrong with a value under the column's validation, without the column name
 * («Solo admite dígitos (0-9).»), or null when it is fine. Empty values are not checked.
 */
export function checkValue(type: CustomFieldType, validation: CustomFieldValidation | undefined, value: Value, today: string): string | null {
  if (!validation || isEmptyValue(value)) return null;
  if (type === "text" || type === "url") {
    const text = String(value).trim();
    if (validation.max_length && text.length > validation.max_length) return `Admite hasta ${validation.max_length} caracteres (tiene ${text.length}).`;
    const only = type === "text" ? validation.only : undefined;
    if (only === "letters" && !/^[\p{L} ]+$/u.test(text)) return "Solo admite letras.";
    if (only === "letters_numbers" && !/^[\p{L}\p{N} ]+$/u.test(text)) return "Solo admite letras y números, sin guiones ni símbolos.";
    if (only === "digits" && !/^[0-9]+$/.test(text)) return "Solo admite dígitos (0-9), sin espacios.";
    if (only === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/.test(text)) return `«${text}» no es un correo válido.`;
    return null;
  }
  if (isNumeric(type)) {
    const n = parseNumber(value);
    if (n == null) return null;
    if (validation.integer_only && !Number.isInteger(n)) return "Tiene que ser un número entero.";
    if (validation.decimals != null && decimalPlaces(n) > validation.decimals) {
      return validation.decimals === 0 ? "No admite decimales." : `Admite hasta ${validation.decimals} ${validation.decimals === 1 ? "decimal" : "decimales"}.`;
    }
    if (validation.min != null && n < validation.min) return `Tiene que ser ${ruleNumber(validation.min, type)} o más.`;
    if (validation.max != null && n > validation.max) return `Tiene que ser ${ruleNumber(validation.max, type)} o menos.`;
    return null;
  }
  if (type === "date") {
    const day = parseIsoDate(value);
    if (!day) return null;
    if (validation.date_limit === "not_future" && day > today) return `No puede ser una fecha futura (${dmy(day)}).`;
    if (validation.date_limit === "not_past" && day < today) return `No puede ser una fecha pasada (${dmy(day)}).`;
  }
  return null;
}

/** Whether the alert fires for a value (the API's evaluate_alert). Never throws. */
export function alertFires(type: CustomFieldType, alert: CustomFieldAlert, value: Value, today: string): boolean {
  if (alert.op === "empty") return isEmptyValue(value);
  if (isEmptyValue(value)) return false;
  if (isNumeric(type) && ["lt", "lte", "gt", "gte", "eq"].includes(alert.op)) {
    const n = parseNumber(value);
    const limit = typeof alert.value === "number" ? alert.value : parseNumber(alert.value as Value);
    if (n == null || limit == null) return false;
    return { lt: n < limit, lte: n <= limit, gt: n > limit, gte: n >= limit, eq: n === limit }[alert.op as "lt"];
  }
  if (type === "date" && (alert.op === "past" || alert.op === "within_days")) {
    const day = parseIsoDate(value);
    if (!day) return false;
    if (alert.op === "past") return day < today;
    if (day < today) return alert.include_past ?? true;
    return day <= shiftDate(today, alert.days ?? 0);
  }
  if (alert.op === "eq" && type === "boolean") {
    const b = asBoolean(value);
    return b !== null && b === asBoolean(alert.value as Value);
  }
  if (alert.op === "eq" && (type === "select" || type === "text")) {
    return alert.value != null && fold(String(value)) === fold(String(alert.value));
  }
  return false;
}

const lowerFirst = (s: string) => (s.length === 1 || /^.[a-záéíóúñü]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The label the API puts on an alert sent without one. */
export function defaultAlertLabel(op: AlertOp, column: string, value: unknown): string {
  const name = column.trim() || "La columna";
  let text: string;
  if (op === "past") text = "Vencido";
  else if (op === "within_days") text = "Por vencer";
  else if (op === "empty") text = `Sin ${lowerFirst(name)}`;
  else if (op === "lt" || op === "lte") text = `${name} bajo`;
  else if (op === "gt" || op === "gte") text = `${name} alto`;
  else if (typeof value === "boolean") text = `${name}: ${value ? "Sí" : "No"}`;
  else text = `${name}: ${String(value ?? "").trim()}`;
  return text.slice(0, MAX_ALERT_LABEL);
}

type AlertProduct = { category_id: string | null; custom_attributes?: CustomAttributes | null };

/**
 * The alerts of one product, in column order, as the API computes them for ProductDTO.alerts.
 * Used where a product view does not carry them (the inventory overview).
 */
export function productAlerts(fields: CustomFieldDTO[], categories: CategoryDTO[], product: AlertProduct, today: string): ProductAlert[] {
  const out: ProductAlert[] = [];
  for (const f of fields) {
    const alert = f.rules?.alert;
    if (!alert || !fieldAppliesTo(f, product.category_id, categories)) continue;
    if (alertFires(f.field_type, alert, product.custom_attributes?.[f.key], today)) {
      out.push({ key: f.key, column: f.label, label: alert.label || "Revisar", tone: alert.tone === "danger" ? "danger" : "warning" });
    }
  }
  return out;
}

/**
 * Rows with their `alerts` filled in, for product views the API sends without them (the
 * inventory overview). Rows that already carry alerts keep them.
 */
export function withAlerts<T extends AlertProduct & { alerts?: ProductAlert[] }>(rows: T[], fields: CustomFieldDTO[], categories: CategoryDTO[], today: string): T[] {
  const alerting = fields.filter((f) => !!f.rules?.alert);
  if (alerting.length === 0) return rows;
  return rows.map((r) => (r.alerts ? r : { ...r, alerts: productAlerts(alerting, categories, r, today) }));
}
