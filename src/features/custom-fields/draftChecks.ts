/** Checks on a column draft before saving, and the PATCH an edit needs. */
import type { CustomFieldDTO, CustomFieldRulesInput } from "@/types/custom-fields";
import { draftFromField, parseOptions, toRules, type ColumnDraft, type ColumnDraftErrors } from "./columnDraft";
import { MAX_ALERT_DAYS, MAX_ALERT_TEXT, MAX_TEXT_LENGTH, parseNumber } from "./rules";

const isNumericType = (t: CustomFieldDTO["field_type"]) => t === "number" || t === "currency";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function validateDraft(
  d: ColumnDraft,
  ctx: { takenLabels: string[]; withScope: boolean; alertsAllowed: boolean },
): ColumnDraftErrors {
  const e: ColumnDraftErrors = {};
  const label = d.label.trim();
  if (!label) e.label = "Escribe el nombre de la columna.";
  else if (ctx.takenLabels.some((l) => fold(l) === fold(label))) e.label = `Ya tienes una columna «${label}».`;
  const options = parseOptions(d.options);
  if (d.field_type === "select" && options.length === 0) e.options = "Escribe al menos una opción.";
  if (ctx.withScope && d.scope === "some" && d.category_ids.length === 0) e.scope = "Elige al menos una categoría.";

  const v = d.validation;
  const t = d.field_type;
  if ((t === "text" || t === "url") && v.max_length.trim()) {
    const n = Number(v.max_length);
    if (!Number.isInteger(n) || n < 1 || n > MAX_TEXT_LENGTH) e.max_length = `Escribe un número entero entre 1 y ${MAX_TEXT_LENGTH}.`;
  }
  if (isNumericType(t)) {
    const min = v.min.trim() ? parseNumber(v.min) : undefined;
    const max = v.max.trim() ? parseNumber(v.max) : undefined;
    if (min === null) e.min = "El mínimo debe ser un número.";
    else if (min != null && v.integer_only && !Number.isInteger(min)) e.min = "Con «solo enteros», el mínimo también debe ser entero.";
    if (max === null) e.max = "El máximo debe ser un número.";
    else if (max != null && v.integer_only && !Number.isInteger(max)) e.max = "Con «solo enteros», el máximo también debe ser entero.";
    if (min != null && max != null && min > max) e.max = "El máximo no puede ser menor que el mínimo.";
  }

  if (ctx.alertsAllowed && d.alert.on) {
    const a = d.alert;
    if (isNumericType(t) && a.op !== "empty" && parseNumber(a.value) == null) e.alert_value = "Escribe el número que activa la alerta.";
    if (a.op === "within_days") {
      const n = Number(a.days);
      if (!Number.isInteger(n) || n < 1 || n > MAX_ALERT_DAYS) e.alert_days = `Indica en cuántos días avisar (entre 1 y ${MAX_ALERT_DAYS}).`;
    }
    if (a.op === "eq" && t === "select") {
      if (!a.value.trim()) e.alert_value = "Elige la opción que activa la alerta.";
      else if (options.length && !options.some((o) => fold(o) === fold(a.value))) e.alert_value = `«${a.value.trim()}» ya no está entre las opciones.`;
    }
    if (a.op === "eq" && t === "text") {
      if (!a.value.trim()) e.alert_value = "Escribe el texto que activa la alerta.";
      else if (a.value.trim().length > MAX_ALERT_TEXT) e.alert_value = `Hasta ${MAX_ALERT_TEXT} caracteres.`;
    }
  }
  return e;
}

/** A PATCH body for a saved column. */
export type FieldPatch = Partial<Pick<CustomFieldDTO, "label" | "options" | "is_visible" | "is_required" | "category_ids">> & {
  rules?: CustomFieldRulesInput;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Only what an edit changed, so an untouched column is not rewritten ({} = nothing to save). */
export function patchFromDraft(field: CustomFieldDTO, d: ColumnDraft, opts: { alerts: boolean; scoped: boolean }): FieldPatch {
  const patch: FieldPatch = {};
  const label = d.label.trim();
  if (label !== field.label) patch.label = label;
  const options = parseOptions(d.options);
  if (field.field_type === "select" && !same(options, field.options)) patch.options = options;
  if (d.is_required !== field.is_required) patch.is_required = d.is_required;
  const ids = d.scope === "some" ? d.category_ids : [];
  if (opts.scoped && !same([...ids].sort(), [...field.category_ids].sort())) patch.category_ids = ids;
  const rules = toRules(d, opts.alerts);
  // A rename resends the rules too: a default alert label («Sin lote») follows the new name.
  if (patch.label !== undefined || !same(rules, toRules(draftFromField(field), opts.alerts))) patch.rules = rules;
  return patch;
}
