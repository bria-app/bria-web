/**
 * The column editor's state, as typed text, and its conversion to and from the API shape.
 * Checks mirror the API's (custom_fields/domain/rules.py) so mistakes show before saving.
 */
import type {
  AlertOp,
  AlertTone,
  CustomFieldAlert,
  CustomFieldDTO,
  CustomFieldRulesInput,
  CustomFieldType,
  CustomFieldValidation,
  DateLimit,
  TextOnly,
} from "@/types/custom-fields";
import { ALERT_OPS, defaultAlertLabel, parseNumber } from "./rules";

export interface ValidationDraft {
  max_length: string;
  only: TextOnly | "";
  integer_only: boolean;
  min: string;
  max: string;
  /** "" = any number of decimals. */
  decimals: string;
  date_limit: DateLimit | "";
}

export interface AlertDraft {
  on: boolean;
  op: AlertOp;
  /** Number as typed, the option, «true»/«false» or the text. */
  value: string;
  days: string;
  include_past: boolean;
  /** Blank = the API's default label. */
  label: string;
  tone: AlertTone;
}

export interface ColumnDraft {
  label: string;
  field_type: CustomFieldType;
  /** Comma-separated (select only). */
  options: string;
  is_required: boolean;
  scope: "all" | "some";
  category_ids: string[];
  validation: ValidationDraft;
  alert: AlertDraft;
}

export type ColumnDraftErrors = Partial<
  Record<"label" | "options" | "scope" | "max_length" | "min" | "max" | "alert_value" | "alert_days" | "alert_label", string>
>;

/** A column suggested for a kind of shop, possibly with rules of its own. */
export interface ColumnPreset {
  label: string;
  field_type: CustomFieldType;
  options?: string[];
  is_required?: boolean;
  rules?: CustomFieldRulesInput;
}

export const BLANK_VALIDATION: ValidationDraft = { max_length: "", only: "", integer_only: false, min: "", max: "", decimals: "", date_limit: "" };

export const blankAlert = (type: CustomFieldType): AlertDraft => ({
  on: false,
  op: ALERT_OPS[type][0],
  value: type === "boolean" ? "true" : "",
  days: "15",
  include_past: true,
  label: "",
  tone: "warning",
});

export const blankDraft = (type: CustomFieldType = "text"): ColumnDraft => ({
  label: "",
  field_type: type,
  options: "",
  is_required: false,
  scope: "all",
  category_ids: [],
  validation: BLANK_VALIDATION,
  alert: blankAlert(type),
});

/** Another type: its checks and conditions differ, so they start over (the alert stays on or off). */
export const withType = (d: ColumnDraft, type: CustomFieldType): ColumnDraft => ({
  ...d,
  field_type: type,
  validation: BLANK_VALIDATION,
  alert: { ...blankAlert(type), on: d.alert.on && ALERT_OPS[type].length > 0 },
});

export const parseOptions = (text: string) => [...new Set(text.split(",").map((o) => o.trim()).filter(Boolean))];

const numText = (n: number | undefined) => (n == null ? "" : String(n));

function validationDraft(v: CustomFieldValidation | undefined): ValidationDraft {
  if (!v) return BLANK_VALIDATION;
  return {
    max_length: numText(v.max_length),
    only: v.only ?? "",
    integer_only: !!v.integer_only,
    min: numText(v.min),
    max: numText(v.max),
    decimals: numText(v.decimals),
    date_limit: v.date_limit ?? "",
  };
}

function alertDraft(type: CustomFieldType, a: CustomFieldRulesInput["alert"] | undefined, column: string): AlertDraft {
  if (!a) return blankAlert(type);
  // A label equal to the API's default stays blank, so it follows a renamed column.
  const label = a.label && a.label !== defaultAlertLabel(a.op, column, a.value) ? a.label : "";
  return {
    on: true,
    op: a.op,
    value: a.value == null ? blankAlert(type).value : String(a.value),
    days: a.days == null ? "15" : String(a.days),
    include_past: a.include_past ?? true,
    label,
    tone: a.tone === "danger" ? "danger" : "warning",
  };
}

export function draftFromField(f: CustomFieldDTO): ColumnDraft {
  return {
    label: f.label,
    field_type: f.field_type,
    options: f.options.join(", "),
    is_required: f.is_required,
    scope: f.category_ids.length ? "some" : "all",
    category_ids: f.category_ids,
    validation: validationDraft(f.rules?.validation),
    alert: alertDraft(f.field_type, f.rules?.alert, f.label),
  };
}

export function draftFromPreset(p: ColumnPreset): ColumnDraft {
  return {
    ...blankDraft(p.field_type),
    label: p.label,
    options: (p.options ?? []).join(", "),
    is_required: !!p.is_required,
    validation: validationDraft(p.rules?.validation),
    alert: alertDraft(p.field_type, p.rules?.alert, p.label),
  };
}

const isNumericType = (t: CustomFieldType) => t === "number" || t === "currency";

/** Only the checks that apply to the type and are turned on. */
export function toValidation(d: ColumnDraft): CustomFieldValidation {
  const v = d.validation;
  const out: CustomFieldValidation = {};
  const t = d.field_type;
  if ((t === "text" || t === "url") && v.max_length.trim()) out.max_length = Number(v.max_length);
  if (t === "text" && v.only) out.only = v.only;
  if (isNumericType(t)) {
    if (v.integer_only) out.integer_only = true;
    else if (v.decimals !== "") out.decimals = Number(v.decimals);
    const min = parseNumber(v.min);
    const max = parseNumber(v.max);
    if (min != null) out.min = min;
    if (max != null) out.max = max;
  }
  if (t === "date" && v.date_limit) out.date_limit = v.date_limit;
  return out;
}

function alertValue(d: ColumnDraft): string | number | boolean | undefined {
  const { op, value } = d.alert;
  if (op !== "eq" && !(isNumericType(d.field_type) && ["lt", "lte", "gt", "gte"].includes(op))) return undefined;
  if (isNumericType(d.field_type)) return parseNumber(value) ?? undefined;
  if (d.field_type === "boolean") return value === "true";
  return value.trim();
}

/** The alert with its final label (the API's default when left blank), or null when off. */
export function toAlert(d: ColumnDraft): CustomFieldAlert | null {
  if (!d.alert.on) return null;
  const value = alertValue(d);
  const out: CustomFieldAlert = { op: d.alert.op, label: "", tone: d.alert.tone };
  if (value !== undefined) out.value = value;
  if (d.alert.op === "within_days") {
    out.days = Number(d.alert.days) || 0;
    out.include_past = d.alert.include_past;
  }
  out.label = d.alert.label.trim() || defaultAlertLabel(out.op, d.label, value);
  return out;
}

/** Body `rules` for create and update. */
export function toRules(d: ColumnDraft, alertsAllowed: boolean): CustomFieldRulesInput {
  const alert = alertsAllowed ? toAlert(d) : null;
  // A blank label is sent blank so the API keeps its own default in step with the column name.
  return { validation: toValidation(d), alert: alert && !d.alert.label.trim() ? { ...alert, label: "" } : alert };
}

export const hasAdvanced = (d: ColumnDraft) => Object.keys(toValidation(d)).length > 0 || d.alert.on;

/** Same column, same settings? (a preset left as suggested is created in one batch). */
export const sameDraft = (a: ColumnDraft, b: ColumnDraft) => JSON.stringify(a) === JSON.stringify(b);

/** A stand-in definition, to preview the input and checks exactly as the product form will. */
export function previewField(d: ColumnDraft, alertsAllowed: boolean): CustomFieldDTO {
  return {
    id: "preview",
    company_id: "",
    entity: "product",
    key: "preview",
    label: d.label.trim() || "Tu columna",
    field_type: d.field_type,
    options: parseOptions(d.options),
    position: 0,
    is_visible: true,
    is_required: d.is_required,
    category_ids: [],
    rules: { validation: toValidation(d), alert: alertsAllowed ? toAlert(d) : null },
  };
}
