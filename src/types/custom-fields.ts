/** User-defined columns (custom fields) and saved UI preferences. */

export type CustomFieldEntity = "product" | "supplier" | "purchase" | "sale";
export type CustomFieldType = "text" | "number" | "currency" | "date" | "boolean" | "select" | "url";

export interface CustomFieldDTO {
  id: string;
  company_id: string;
  entity: CustomFieldEntity;
  /** Stable slug used as the key inside each record's `custom_attributes`. */
  key: string;
  label: string;
  field_type: CustomFieldType;
  options: string[];
  position: number;
  is_visible: boolean;
  is_required: boolean;
  /**
   * Product columns only: the product types (category ids) this column applies to,
   * subcategories included. Empty = every product.
   */
  category_ids: string[];
  /** Advanced rules: what a value may look like and when a product needs attention. */
  rules?: CustomFieldRules;
}

/** What a text column admits (`rules.validation.only`). */
export type TextOnly = "letters" | "letters_numbers" | "digits" | "email";
export type DateLimit = "not_future" | "not_past";

/** Checks on each value, by column type. A missing key means «off». */
export interface CustomFieldValidation {
  /** text, url */
  max_length?: number;
  /** text */
  only?: TextOnly;
  /** number, currency */
  integer_only?: boolean;
  min?: number;
  max?: number;
  decimals?: number;
  /** date: today (Lima) is always allowed. */
  date_limit?: DateLimit;
}

export type AlertOp = "lt" | "lte" | "gt" | "gte" | "eq" | "empty" | "within_days" | "past";
export type AlertTone = "warning" | "danger";

/** One condition per product column that marks the product as needing attention. */
export interface CustomFieldAlert {
  op: AlertOp;
  value?: string | number | boolean;
  /** within_days only. */
  days?: number;
  /** within_days only: dates already past fire too (default true). */
  include_past?: boolean;
  /** Always filled by the API (a default when sent blank). */
  label: string;
  tone: AlertTone;
}

/** As the API returns them: always both keys. */
export interface CustomFieldRules {
  validation: CustomFieldValidation;
  alert: CustomFieldAlert | null;
}

/** As sent on create/update. A blank alert label gets the API's default. */
export interface CustomFieldRulesInput {
  validation?: CustomFieldValidation;
  alert?: (Omit<CustomFieldAlert, "label" | "tone"> & { label?: string; tone?: AlertTone }) | null;
}

/** An alert that fired on a product (ProductDTO.alerts). */
export interface ProductAlert {
  /** The custom_attributes key. */
  key: string;
  /** The column label. */
  column: string;
  label: string;
  tone: AlertTone;
}

export type CustomAttributes = Record<string, string | number | boolean | null>;

export const CUSTOM_FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "Texto",
  number: "Número",
  currency: "Monto (S/)",
  date: "Fecha",
  boolean: "Sí / No",
  select: "Lista de opciones",
  url: "Enlace",
};
