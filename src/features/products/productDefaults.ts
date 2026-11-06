"use client";

import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { EMPTY_PRODUCT_FORM, UOM_OPTIONS, type ProductFormState } from "./productForm";

/** How this shop creates products. Asked once (first product), editable in Configuración → Negocio. */
export interface ProductDefaults {
  /** The barcode doubles as the product code (SKU) when no other code is typed. */
  barcode_as_sku: boolean;
  unit_of_measure: string;
  /** «Avísame cuando queden…» */
  safety_stock: number;
  /** Days from ordering to receiving, the usual case. */
  lead_time_days: number;
  /** Usual markup over cost, to suggest a price; null = don't suggest. */
  markup_pct: number | null;
  /** Set once the person answered (or accepted) the questions. */
  confirmed_at?: string;
}

export const PRODUCT_DEFAULTS_PREF = "catalog:product-defaults";

export const STANDARD_DEFAULTS: ProductDefaults = {
  barcode_as_sku: true,
  unit_of_measure: "unit",
  safety_stock: 5,
  lead_time_days: 3,
  markup_pct: null,
};

const wholeOr = (v: unknown, fallback: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : fallback);

/** Whatever the server holds, made valid (unknown keys dropped, bad values replaced). */
export function parseProductDefaults(raw: unknown): ProductDefaults {
  const r = raw && typeof raw === "object" ? (raw as Partial<ProductDefaults>) : {};
  return {
    barcode_as_sku: typeof r.barcode_as_sku === "boolean" ? r.barcode_as_sku : STANDARD_DEFAULTS.barcode_as_sku,
    unit_of_measure: UOM_OPTIONS.some((o) => o.value === r.unit_of_measure) ? (r.unit_of_measure as string) : STANDARD_DEFAULTS.unit_of_measure,
    safety_stock: wholeOr(r.safety_stock, STANDARD_DEFAULTS.safety_stock),
    lead_time_days: wholeOr(r.lead_time_days, STANDARD_DEFAULTS.lead_time_days),
    markup_pct: typeof r.markup_pct === "number" && r.markup_pct > 0 && r.markup_pct < 1000 ? r.markup_pct : null,
    confirmed_at: typeof r.confirmed_at === "string" ? r.confirmed_at : undefined,
  };
}

export function useProductDefaults(companyId: string | null) {
  return useCompanyPreference(companyId, PRODUCT_DEFAULTS_PREF, parseProductDefaults);
}

/** A blank «Agregar producto» form with the shop's defaults filled in. */
export function blankFormWith(d: ProductDefaults): ProductFormState {
  return {
    ...EMPTY_PRODUCT_FORM,
    unit_of_measure: d.unit_of_measure,
    safety_stock: String(d.safety_stock),
    reorder_point: String(d.safety_stock),
    lead_time_days: String(d.lead_time_days),
  };
}

/** The code to send on create: what was typed, else the barcode when that is the shop's rule. */
export function skuFor(form: Pick<ProductFormState, "sku" | "barcode">, d: ProductDefaults): string | null {
  return form.sku.trim() || (d.barcode_as_sku ? form.barcode.trim() : "") || null;
}

/** Price suggested from cost and the usual markup, rounded to 10 céntimos. */
export function suggestedPrice(cost: string, d: ProductDefaults): number | null {
  const c = Number(cost);
  if (!d.markup_pct || !cost.trim() || !Number.isFinite(c) || c <= 0) return null;
  return Math.ceil(c * (1 + d.markup_pct / 100) * 10) / 10;
}
