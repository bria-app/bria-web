import { checkValue, limaToday } from "@/features/custom-fields/rules";
import type { ProductDTO } from "@/types/api";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";
import type { ProductWriteBody } from "@/types/inventory";

/** Everything the product form edits, as typed text (numbers are parsed on save). */
export interface ProductFormState {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category_id: string;
  unit_cost: string;
  unit_price: string;
  currency: string;
  unit_of_measure: string;
  lead_time_days: string;
  safety_stock: string;
  reorder_point: string;
  /** Create only: units on the shelf today. */
  initial_stock: string;
  image_url: string | null;
  is_active: boolean;
  custom: CustomAttributes;
}

export type ProductFormKey = keyof ProductFormState;
export type ProductFormErrors = Partial<Record<ProductFormKey | `custom:${string}`, string>>;

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  category_id: "",
  unit_cost: "",
  unit_price: "",
  currency: "PEN",
  unit_of_measure: "unit",
  lead_time_days: "0",
  safety_stock: "0",
  reorder_point: "0",
  initial_stock: "",
  image_url: null,
  is_active: true,
  custom: {},
};

export const UOM_OPTIONS = [
  { value: "unit", label: "Unidad" },
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "bolsa", label: "Bolsa" },
  { value: "par", label: "Par" },
  { value: "docena", label: "Docena" },
];

/** Common spellings (Excel files, other systems) of each unit in UOM_OPTIONS. */
const UOM_SYNONYMS: Record<string, string[]> = {
  unit: ["unit", "units", "unidad", "unidades", "und", "unds", "un", "u", "uni", "unid"],
  kg: ["kg", "kgs", "kilo", "kilos", "kilogramo", "kilogramos"],
  g: ["g", "gr", "grs", "gramo", "gramos"],
  l: ["l", "lt", "lts", "litro", "litros"],
  ml: ["ml", "mililitro", "mililitros"],
  caja: ["caja", "cajas", "cj"],
  paquete: ["paquete", "paquetes", "paq", "pqt"],
  bolsa: ["bolsa", "bolsas"],
  par: ["par", "pares"],
  docena: ["docena", "docenas", "doc"],
};

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\.$/, "");

/** «Unidades», «KG», «Kilos» → the unit the form knows («unit», «kg»); anything else stays as typed. */
export function normalizeUnit(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const p = plain(raw);
  const known = Object.entries(UOM_SYNONYMS).find(([, names]) => names.includes(p));
  return known ? known[0] : raw.trim();
}

export const CURRENCY_OPTIONS = [
  { value: "PEN", label: "Soles (S/)" },
  { value: "USD", label: "Dólares (US$)" },
];

export function formFromProduct(p: ProductDTO): ProductFormState {
  return {
    sku: p.sku,
    barcode: p.barcode ?? "",
    name: p.name,
    description: p.description ?? "",
    category_id: p.category_id ?? "",
    // A hidden cost (null) stays empty instead of turning into "0".
    unit_cost: p.unit_cost == null ? "" : String(Number(p.unit_cost)),
    unit_price: String(Number(p.unit_price)),
    currency: p.currency,
    unit_of_measure: p.unit_of_measure,
    lead_time_days: String(p.lead_time_days),
    safety_stock: String(p.safety_stock),
    reorder_point: String(p.reorder_point),
    initial_stock: "",
    image_url: p.image_url ?? null,
    is_active: p.is_active,
    custom: { ...(p.custom_attributes ?? {}) },
  };
}

const isWholeNumber = (s: string) => {
  const n = Number(s || 0);
  return Number.isInteger(n) && n >= 0;
};

const isEmpty = (v: CustomAttributes[string] | undefined) => v == null || (typeof v === "string" && v.trim() === "");

/**
 * The problem with one own value, or undefined. A value equal to the saved one is not
 * re-checked (the API does the same), so a rule added later never blocks old products.
 */
export function customFieldError(field: CustomFieldDTO, value: CustomAttributes[string] | undefined, original?: CustomAttributes): string | undefined {
  if (field.is_required && isEmpty(value)) return "Es obligatoria: llénala.";
  if (isEmpty(value) || (original && original[field.key] === value)) return undefined;
  if ((field.field_type === "number" || field.field_type === "currency") && !Number.isFinite(Number(value))) return "Tiene que ser un número.";
  return checkValue(field.field_type, field.rules?.validation, value, limaToday()) ?? undefined;
}

/**
 * Client-side validation. Required own columns are checked here because the backend
 * stores `is_required` but does not enforce it on product writes; the rest mirrors its rules.
 */
export function validateProductForm(
  f: ProductFormState,
  opts: { isEdit: boolean; fields: CustomFieldDTO[]; original?: CustomAttributes },
): ProductFormErrors {
  const e: ProductFormErrors = {};
  if (!f.name.trim()) e.name = "Escribe el nombre del producto.";
  const price = Number(f.unit_price);
  if (f.unit_price.trim() === "" || Number.isNaN(price) || price < 0) e.unit_price = "Escribe el precio de venta (0 o más).";
  const cost = Number(f.unit_cost || 0);
  if (Number.isNaN(cost) || cost < 0) e.unit_cost = "El costo no puede ser negativo.";
  for (const k of ["lead_time_days", "safety_stock", "reorder_point"] as const) {
    if (!isWholeNumber(f[k])) e[k] = "Escribe un número entero, 0 o más.";
  }
  if (!opts.isEdit && f.initial_stock !== "" && !isWholeNumber(f.initial_stock)) {
    e.initial_stock = "Escribe un número entero, 0 o más.";
  }
  for (const field of opts.fields) {
    const problem = customFieldError(field, f.custom[field.key], opts.original);
    if (problem) e[`custom:${field.key}`] = problem;
  }
  return e;
}

/**
 * The API names the column first in a value error («Código interno: solo admite dígitos.»):
 * that message goes under the column instead of on top of the form.
 */
export function apiCustomFieldError(message: string, fields: CustomFieldDTO[]): ProductFormErrors | null {
  const field = [...fields].sort((a, b) => b.label.length - a.label.length).find((f) => message.startsWith(`${f.label}:`));
  if (!field) return null;
  const rest = message.slice(field.label.length + 1).trim();
  return { [`custom:${field.key}`]: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

/** PATCH/POST body shared by create and edit. Empty custom values are dropped, others kept. */
export function productWriteBody(f: ProductFormState): ProductWriteBody {
  return {
    name: f.name.trim(),
    description: f.description.trim(),
    category_id: f.category_id || null,
    unit_cost: Number(f.unit_cost || 0),
    unit_price: Number(f.unit_price),
    unit_of_measure: f.unit_of_measure || "unit",
    lead_time_days: Number(f.lead_time_days || 0),
    safety_stock: Number(f.safety_stock || 0),
    reorder_point: Number(f.reorder_point || 0),
    barcode: f.barcode.trim() || null,
    image_url: f.image_url,
    is_active: f.is_active,
    custom_attributes: Object.fromEntries(Object.entries(f.custom).filter(([, v]) => !isEmpty(v))),
  };
}

/** Body to edit `product` from `f`: the SKU is only sent when it really changed. */
export function productUpdateBody(f: ProductFormState, product: ProductDTO): ProductWriteBody {
  const sku = f.sku.trim();
  const body: ProductWriteBody = { ...productWriteBody(f), ...(sku && sku.toUpperCase() !== product.sku ? { sku } : {}) };
  // The API hid the cost and nobody typed one: leave it as it is instead of writing 0.
  if (product.unit_cost == null && f.unit_cost.trim() === "") delete body.unit_cost;
  return body;
}

/** How many fields differ between two states (for «3 cambios sin guardar»). */
export function changedFields(a: ProductFormState, b: ProductFormState): number {
  let n = 0;
  for (const k of Object.keys(a) as ProductFormKey[]) {
    if (k === "custom") {
      const keys = new Set([...Object.keys(a.custom), ...Object.keys(b.custom)]);
      for (const ck of keys) if ((a.custom[ck] ?? "") !== (b.custom[ck] ?? "")) n += 1;
    } else if (a[k] !== b[k]) n += 1;
  }
  return n;
}
