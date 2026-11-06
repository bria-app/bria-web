/** Plain-Spanish readings of a column's rules, for the editor, the lists and the product form. */
import type { AlertOp, CustomFieldType, CustomFieldValidation, TextOnly } from "@/types/custom-fields";
import { ruleNumber } from "./rules";

export const TEXT_ONLY_LABEL: Record<TextOnly, string> = {
  letters: "Solo letras",
  letters_numbers: "Letras y números",
  digits: "Solo dígitos (0-9)",
  email: "Un correo",
};

/** How each condition reads after «Avísame cuando <columna>…». */
export function opLabel(op: AlertOp, type: CustomFieldType): string {
  switch (op) {
    case "lt":
      return "sea menor que";
    case "lte":
      return "sea menor o igual a";
    case "gt":
      return "sea mayor que";
    case "gte":
      return "sea mayor o igual a";
    case "eq":
      return type === "text" ? "diga" : type === "number" || type === "currency" ? "sea igual a" : "sea";
    case "within_days":
      return "esté por llegar";
    case "past":
      return "ya haya pasado";
    case "empty":
      return type === "boolean" ? "no tenga respuesta" : "esté vacía";
  }
}

/** Short pieces («Solo dígitos (0-9)», «Hasta 8 caracteres») of what a column admits. */
export function validationParts(type: CustomFieldType, v: CustomFieldValidation | undefined): string[] {
  if (!v) return [];
  const parts: string[] = [];
  if (type === "text" && v.only) parts.push(TEXT_ONLY_LABEL[v.only]);
  if ((type === "text" || type === "url") && v.max_length) parts.push(`Hasta ${v.max_length} caracteres`);
  if (type === "number" || type === "currency") {
    if (v.integer_only) parts.push("Solo enteros");
    else if (v.decimals != null) parts.push(v.decimals === 0 ? "Sin decimales" : `Hasta ${v.decimals} ${v.decimals === 1 ? "decimal" : "decimales"}`);
    if (v.min != null && v.max != null) parts.push(`De ${ruleNumber(v.min, type)} a ${ruleNumber(v.max, type)}`);
    else if (v.min != null) parts.push(`Desde ${ruleNumber(v.min, type)}`);
    else if (v.max != null) parts.push(`Hasta ${ruleNumber(v.max, type)}`);
  }
  if (type === "date" && v.date_limit) parts.push(v.date_limit === "not_future" ? "Sin fechas futuras" : "Sin fechas pasadas");
  return parts;
}

interface AlertShape {
  op: AlertOp;
  value?: string | number | boolean;
  days?: number;
  include_past?: boolean;
}

/**
 * «Te avisamos cuando la fecha esté a 15 días o menos» — the alert read back. The UI shows
 * the alert's label (as it will look) right after it.
 */
export function alertSentence(column: string, type: CustomFieldType, alert: AlertShape): string {
  const name = `«${column.trim() || "la columna"}»`;
  const value = (): string => {
    if (typeof alert.value === "boolean") return alert.value ? "Sí" : "No";
    if ((type === "number" || type === "currency") && typeof alert.value === "number") return ruleNumber(alert.value, type);
    const text = String(alert.value ?? "").trim();
    return type === "text" ? `«${text || "…"}»` : text || "…";
  };
  switch (alert.op) {
    case "within_days": {
      const days = alert.days && alert.days > 0 ? alert.days : null;
      const span = days ? `a ${days} ${days === 1 ? "día" : "días"} o menos` : "a pocos días";
      return `Te avisamos cuando la fecha esté ${span}${alert.include_past ?? true ? ", o ya haya pasado" : ""}`;
    }
    case "past":
      return "Te avisamos cuando la fecha ya haya pasado";
    case "empty":
      return `Te avisamos cuando un producto no tenga ${name}`;
    default:
      return `Te avisamos cuando ${name} ${opLabel(alert.op, type)} ${value()}`;
  }
}
