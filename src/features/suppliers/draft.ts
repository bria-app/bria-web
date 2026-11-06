/** Editable supplier data shared by «Nuevo proveedor» and the Ficha tab. */
import type { SupplierDTO } from "@/types/api";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";
import { rucError } from "./ruc";

export interface SupplierDraft {
  ruc: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  custom: CustomAttributes;
}

export type TextKey = "business_name" | "contact_name" | "phone" | "email" | "address";

export const EMPTY_DRAFT: SupplierDraft = {
  ruc: "",
  business_name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  is_active: true,
  custom: {},
};

export function draftFrom(s: SupplierDTO): SupplierDraft {
  return {
    ruc: s.ruc,
    business_name: s.business_name,
    contact_name: s.contact_name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    is_active: s.is_active,
    custom: { ...(s.custom_attributes ?? {}) },
  };
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field errors keyed by field name (`custom:<key>` for the company's own fields). */
export function validateDraft(d: SupplierDraft, fields: CustomFieldDTO[], checkRuc: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (checkRuc) {
    const e = rucError(d.ruc);
    if (e) errors.ruc = e;
  }
  if (!d.business_name.trim()) errors.business_name = "Escribe la razón social o el nombre del proveedor.";
  if (d.email.trim() && !EMAIL.test(d.email.trim())) errors.email = "Revisa el correo: le falta la @ o el dominio.";
  for (const f of fields) {
    if (f.is_required && isEmpty(d.custom[f.key])) errors[`custom:${f.key}`] = `«${f.label}» es obligatorio.`;
  }
  return errors;
}

/** Labels of the fields that differ between two drafts. */
export function changedFields(before: SupplierDraft, after: SupplierDraft, fields: CustomFieldDTO[]): string[] {
  const labels: Record<TextKey, string> = {
    business_name: "razón social",
    contact_name: "contacto",
    phone: "teléfono",
    email: "correo",
    address: "dirección",
  };
  const out = (Object.keys(labels) as TextKey[]).filter((k) => before[k].trim() !== after[k].trim()).map((k) => labels[k]);
  if (before.is_active !== after.is_active) out.push("estado");
  for (const f of fields) {
    const a = before.custom[f.key];
    const b = after.custom[f.key];
    if ((isEmpty(a) ? "" : String(a)) !== (isEmpty(b) ? "" : String(b))) out.push(f.label);
  }
  return out;
}

/** Body for POST/PATCH /suppliers: trimmed text and the custom values. */
export function payloadOf(d: SupplierDraft) {
  return {
    business_name: d.business_name.trim(),
    contact_name: d.contact_name.trim(),
    phone: d.phone.trim(),
    email: d.email.trim(),
    address: d.address.trim(),
    custom_attributes: d.custom,
  };
}
