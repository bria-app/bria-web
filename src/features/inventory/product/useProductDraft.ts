"use client";

import { useMemo, useState } from "react";
import { catalogApi } from "@/services/api/inventory";
import { fieldsForCategory } from "@/features/custom-fields/scope";
import type { CategoryDTO, ProductDTO } from "@/types/api";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";
import {
  apiCustomFieldError,
  changedFields,
  formFromProduct,
  productUpdateBody,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormKey,
  type ProductFormState,
} from "@/features/products/productForm";

/**
 * Inline editing of a product sheet: a draft over the saved product, a dirty count for the
 * save bar, client-side validation (required custom fields included) and save/discard.
 * The saved product returned by the API replaces the loaded one right away, so the sheet
 * does not flash old values while the page reloads.
 */
export function useProductDraft(
  companyId: string | null,
  loaded: ProductDTO | null,
  fields: CustomFieldDTO[],
  categories: CategoryDTO[],
) {
  const [saved, setSaved] = useState<ProductDTO | null>(null);
  const [draft, setDraft] = useState<Partial<ProductFormState>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A value the API refused, shown under its column until it is changed.
  const [apiErrors, setApiErrors] = useState<ProductFormErrors>({});

  const product = saved && loaded && saved.id === loaded.id ? saved : loaded;
  const base = useMemo(() => (product ? formFromProduct(product) : null), [product]);
  const form = useMemo(() => (base ? { ...base, ...draft } : null), [base, draft]);
  const applicable = useMemo(() => (form ? fieldsForCategory(fields, form.category_id, categories) : []), [fields, form, categories]);
  const dirty = form && base ? changedFields(form, base) : 0;
  const original = base?.custom;
  const errors: ProductFormErrors = {
    ...apiErrors,
    ...(form && showErrors ? validateProductForm(form, { isEdit: true, fields: applicable, original }) : {}),
  };

  const set = <K extends ProductFormKey>(key: K, value: ProductFormState[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setCustom = (key: string, value: CustomAttributes[string]) => {
    setDraft((d) => ({ ...d, custom: { ...(d.custom ?? base?.custom ?? {}), [key]: value } }));
    setApiErrors((e) => {
      if (!e[`custom:${key}`]) return e;
      const rest = { ...e };
      delete rest[`custom:${key}`];
      return rest;
    });
  };

  const discard = () => {
    setDraft({});
    setShowErrors(false);
    setError(null);
    setApiErrors({});
  };

  /** Saves the draft. Resolves with the form as it was before, for «Deshacer», or null. */
  const save = async (): Promise<{ before: ProductFormState; changes: number } | null> => {
    if (!companyId || !product || !form || !base) return null;
    if (Object.keys(validateProductForm(form, { isEdit: true, fields: applicable, original })).length > 0) {
      setShowErrors(true);
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      const next = await catalogApi.update(companyId, product.id, productUpdateBody(form, product));
      const changes = dirty;
      setSaved(next);
      setDraft({});
      setShowErrors(false);
      return { before: base, changes };
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar.";
      const onField = apiCustomFieldError(message, applicable);
      if (onField) {
        setApiErrors(onField);
        setError(`Revisa «${applicable.find((f) => onField[`custom:${f.key}`])?.label ?? "la columna marcada"}» antes de guardar.`);
      } else setError(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  /** Puts a previous state back (used by «Deshacer»). */
  const restore = async (before: ProductFormState) => {
    if (!companyId || !product) return;
    setSaved(await catalogApi.update(companyId, product.id, productUpdateBody(before, product)));
  };

  /** Takes the product off sale (PATCH is_active=false) without touching the rest of the draft. */
  const pause = async () => {
    if (!companyId || !product) return;
    const next = await catalogApi.update(companyId, product.id, { is_active: false });
    setSaved(next);
    setDraft((d) => {
      const rest = { ...d };
      delete rest.is_active;
      return rest;
    });
  };

  return { product, form, errors, original, applicable, dirty, saving, error, set, setCustom, save, discard, restore, pause };
}
