"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ProductFields } from "@/features/products/ProductFields";
import { ProductCustomFields } from "@/features/products/ProductCustomFields";
import { FormSection } from "@/features/products/FormBits";
import { formatNumber } from "@/lib/format";
import { ApiError } from "@/services/api/client";
import { productsApi } from "@/services/api/resources";
import type { CategoryDTO, ProductDTO } from "@/types/api";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";
import type { ProductFormErrors, ProductFormKey, ProductFormState } from "@/features/products/productForm";
import { unitLabel } from "@/features/inventory/stockStatus";

interface SheetTabProps {
  companyId: string | null;
  product: ProductDTO;
  form: ProductFormState;
  errors: ProductFormErrors;
  set: <K extends ProductFormKey>(key: K, value: ProductFormState[K]) => void;
  setCustom: (key: string, value: CustomAttributes[string]) => void;
  categories: CategoryDTO[];
  /** All product fields, and the ones that apply to the current category. */
  fields: CustomFieldDTO[];
  applicable: CustomFieldDTO[];
  stockOnHand: number;
  disabled: boolean;
  onAdjust: () => void;
  onManageFields: () => void;
  /** A field was created from the sheet: reload the company's fields. */
  onFieldCreated: () => void;
  onDeleted: () => void;
  /** Takes the product off sale; offered when the API refuses the delete because it has history. */
  onPause: () => Promise<void>;
}

/** «Ficha»: every field, edited in place; the save bar lives on the page. */
export function SheetTab(props: SheetTabProps) {
  const { companyId, product, form, errors, set, setCustom, categories, fields, applicable, stockOnHand, disabled, onAdjust, onManageFields, onFieldCreated, onDeleted, onPause } =
    props;
  const category = categories.find((c) => c.id === form.category_id) ?? null;
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 409: it has sales or purchases, so it can only be paused.
  const [hasHistory, setHasHistory] = useState(false);
  const [pausing, setPausing] = useState(false);

  const remove = async () => {
    if (!companyId) return;
    setDeleting(true);
    setDeleteError(null);
    setHasHistory(false);
    try {
      await productsApi.remove(companyId, product.id);
      onDeleted();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo eliminar. Si ya tiene ventas, mejor ponlo en pausa.");
      setHasHistory(err instanceof ApiError && err.status === 409);
      setConfirm(false);
      setDeleting(false);
    }
  };

  const pause = async () => {
    setPausing(true);
    try {
      await onPause();
      setDeleteError(null);
      setHasHistory(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "No se pudo poner en pausa.");
    } finally {
      setPausing(false);
    }
  };

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <ProductFields
        form={form}
        errors={errors}
        onChange={set}
        categories={categories}
        mode="edit"
        lastCost={product.last_cost}
        disabled={disabled}
        stockSlot={
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-soft px-4 py-3">
            <span className="text-[13px] font-semibold text-text-secondary">Tienes ahora</span>
            <span className="font-mono text-[18px] font-semibold text-text-primary">
              {formatNumber(stockOnHand)} {unitLabel(product.unit_of_measure)}
            </span>
            <span className="min-w-0 flex-1 basis-[220px] text-[12.5px] text-text-muted">
              No se edita a mano: usa «Ajustar inventario» y queda en entradas y salidas con su motivo.
            </span>
            <Button size="sm" variant="secondary" onClick={onAdjust}>
              Ajustar inventario
            </Button>
          </div>
        }
      >
        <ProductCustomFields
          fields={applicable}
          otherCount={fields.length - applicable.length}
          categoryName={category?.name}
          values={form.custom}
          original={product.custom_attributes ?? {}}
          errors={errors}
          disabled={disabled}
          onChange={setCustom}
          onManage={onManageFields}
          quickAdd={
            companyId
              ? {
                  companyId,
                  takenLabels: fields.map((f) => f.label),
                  category: category ? { id: category.id, name: category.name } : null,
                  onCreated: onFieldCreated,
                }
              : undefined
          }
        />
      </ProductFields>

      <FormSection title="Venta" description="Un producto en pausa sigue en tu inventario con su historia, pero ya no lo vendes.">
        <Switch showLabel label="A la venta" checked={form.is_active} onChange={(v) => set("is_active", v)} disabled={disabled} />
      </FormSection>

      <FormSection title="Eliminar producto" description="Se borra para siempre. Si ya tiene ventas o compras, ponlo en pausa.">
        {deleteError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-4 py-3">
            <p className="min-w-0 flex-1 basis-[240px] text-sm text-danger">{deleteError}</p>
            {hasHistory && product.is_active && (
              <Button size="sm" variant="secondary" onClick={() => void pause()} loading={pausing} disabled={disabled}>
                Pausar producto
              </Button>
            )}
          </div>
        )}
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">¿Eliminar «{product.name}» para siempre?</span>
            <Button size="sm" variant="danger" onClick={remove} loading={deleting}>
              Sí, eliminar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)} disabled={deleting}>
              No
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>
            Eliminar producto
          </Button>
        )}
      </FormSection>
    </form>
  );
}
