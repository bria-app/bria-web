"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { catalogApi } from "@/services/api/inventory";
import { customFieldsApi } from "@/services/api/custom-fields";
import { fieldsForCategory } from "@/features/custom-fields/scope";
import { useApi } from "@/hooks/useApi";
import type { CategoryDTO, ProductDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { ProductFields } from "./ProductFields";
import { ProductCustomFields } from "./ProductCustomFields";
import { FirstProductSetup } from "./FirstProductSetup";
import { blankFormWith, skuFor, suggestedPrice, useProductDefaults } from "./productDefaults";
import { apiCustomFieldError, productWriteBody, validateProductForm, type ProductFormErrors, type ProductFormKey, type ProductFormState } from "./productForm";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  /** Always new: an existing product is edited on its own page («Ficha»). */
  product?: null;
  categories: CategoryDTO[];
  onSaved: (product: ProductDTO) => void;
  /** Company custom fields for products; loaded on demand when omitted. */
  fields?: CustomFieldDTO[];
  /** A field was created from the form: the parent refreshes its columns. */
  onFieldsChanged?: () => void;
}

/** «Agregar producto»: a new product, with the shop's defaults filled in. */
export function ProductFormModal({ open, onClose, companyId, categories, onSaved, fields: fieldsProp, onFieldsChanged }: ProductFormModalProps) {
  const defaults = useProductDefaults(companyId);
  const [form, setForm] = useState<ProductFormState>(() => blankFormWith(defaults.value));
  const [showErrors, setShowErrors] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // A value the API refused, shown under its column until it is changed.
  const [apiFieldErrors, setApiFieldErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);

  // Every time the dialog opens it starts blank: reset while rendering. The shop's defaults
  // may arrive after opening; the blank form picks them up when they do.
  const [session, setSession] = useState({ open: false, ready: false });
  if (session.open !== open || session.ready !== !defaults.loading) {
    setSession({ open, ready: !defaults.loading });
    if (open) {
      setForm(blankFormWith(defaults.value));
      setShowErrors(false);
      setApiError(null);
      setApiFieldErrors({});
    }
  }

  const loaded = useApi(
    () => (companyId && open && !fieldsProp ? customFieldsApi.list(companyId, "product") : Promise.resolve([] as CustomFieldDTO[])),
    [companyId, open, !!fieldsProp],
  );
  // Fields created from this form show at once, before the parent's list refreshes.
  const [created, setCreated] = useState<CustomFieldDTO[]>([]);
  const [skippedSetup, setSkippedSetup] = useState(false);
  const allFields = useMemo(() => {
    const base = fieldsProp ?? loaded.data ?? [];
    return [...base, ...created.filter((c) => !base.some((f) => f.id === c.id))];
  }, [fieldsProp, loaded.data, created]);
  const fields = useMemo(() => fieldsForCategory(allFields, form.category_id, categories), [allFields, form.category_id, categories]);
  const errors: ProductFormErrors = { ...apiFieldErrors, ...(showErrors ? validateProductForm(form, { isEdit: false, fields }) : {}) };

  const set = <K extends ProductFormKey>(key: K, value: ProductFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (ev?: React.FormEvent) => {
    ev?.preventDefault();
    if (!companyId) return;
    const errs = validateProductForm(form, { isEdit: false, fields });
    if (Object.keys(errs).length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      const saved = await catalogApi.create(companyId, {
        ...productWriteBody(form),
        sku: skuFor(form, defaults.value),
        currency: form.currency,
        initial_stock: form.initial_stock ? Number(form.initial_stock) : 0,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el producto.";
      const onField = apiCustomFieldError(message, fields);
      if (onField) setApiFieldErrors(onField);
      else setApiError(message);
    } finally {
      setSaving(false);
    }
  };

  const nErrors = Object.keys(errors).length;
  const currentCategory = categories.find((c) => c.id === form.category_id) ?? null;
  const suggestion = suggestedPrice(form.unit_cost, defaults.value);

  // First product of the shop: a few questions, answered once, before the form.
  if (open && !skippedSetup && !defaults.loading && !defaults.value.confirmed_at) {
    return (
      <FirstProductSetup
        open={open}
        onClose={onClose}
        onSkip={() => setSkippedSetup(true)}
        initial={defaults.value}
        onSave={async (next) => {
          await defaults.save(next);
          setForm(blankFormWith(next));
        }}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Agregar producto"
      description="Solo necesitas el nombre y el precio. Lo demás lo completas cuando quieras."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => submit()} loading={saving}>
            Crear producto
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-6">
        {apiError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {apiError}
          </p>
        )}
        {nErrors > 0 && (
          <p role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
            Revisa {nErrors === 1 ? "el campo marcado" : `los ${nErrors} campos marcados`} antes de guardar.
          </p>
        )}
        <ProductFields
          form={form}
          errors={errors}
          onChange={set}
          categories={categories}
          mode="create"
          disabled={saving}
          skuFromBarcode={defaults.value.barcode_as_sku}
          priceSuggestion={suggestion != null && defaults.value.markup_pct ? { value: suggestion, markup: defaults.value.markup_pct } : null}
        >
          <ProductCustomFields
            fields={fields}
            otherCount={allFields.length - fields.length}
            categoryName={currentCategory?.name}
            values={form.custom}
            errors={errors}
            disabled={saving}
            onChange={(key, v) => {
              setForm((f) => ({ ...f, custom: { ...f.custom, [key]: v } }));
              setApiFieldErrors((e) => {
                const rest = { ...e };
                delete rest[`custom:${key}`];
                return rest;
              });
            }}
            quickAdd={
              companyId
                ? {
                    companyId,
                    takenLabels: allFields.map((f) => f.label),
                    category: currentCategory ? { id: currentCategory.id, name: currentCategory.name } : null,
                    onCreated: (field) => {
                      setCreated((c) => [...c, field]);
                      onFieldsChanged?.();
                    },
                  }
                : undefined
            }
          />
        </ProductFields>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
