"use client";

import { ReactNode, useId, useMemo, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { formatNumber, percent, soles } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { marginPct } from "@/features/inventory/stockStatus";
import type { CategoryDTO, Numeric } from "@/types/api";
import { ProductImagePicker } from "./ProductImagePicker";
import { FieldShell, FormSection } from "./FormBits";
import { categoryOptions } from "./categoryTree";
import {
  CURRENCY_OPTIONS,
  UOM_OPTIONS,
  type ProductFormErrors,
  type ProductFormKey,
  type ProductFormState,
} from "./productForm";

interface ProductFieldsProps {
  form: ProductFormState;
  errors: ProductFormErrors;
  onChange: <K extends ProductFormKey>(key: K, value: ProductFormState[K]) => void;
  categories: CategoryDTO[];
  mode: "create" | "edit";
  /** Cost of the latest purchase (edit only). */
  lastCost?: Numeric | null;
  disabled?: boolean;
  /** Edit only: the units on hand (read-only) and the way to change them. */
  stockSlot?: ReactNode;
  /** Custom fields, rendered after the inventory section. */
  children?: ReactNode;
  /** Create only: the shop uses the barcode as product code, so the SKU field stays tucked away. */
  skuFromBarcode?: boolean;
  /** Price from cost and the shop's usual markup. */
  priceSuggestion?: { value: number; markup: number } | null;
}

/** The product's own data, shared by «Agregar producto» and the product sheet. */
export function ProductFields({
  form,
  errors,
  onChange,
  categories,
  mode,
  lastCost,
  disabled,
  stockSlot,
  children,
  skuFromBarcode = false,
  priceSuggestion,
}: ProductFieldsProps) {
  const ids = useId();
  const create = mode === "create";
  const [ownSku, setOwnSku] = useState(false);
  const showSku = !create || !skuFromBarcode || ownSku || !!form.sku;
  const catOptions = useMemo(() => categoryOptions(categories, "Sin categoría"), [categories]);
  const uomOptions = UOM_OPTIONS.some((o) => o.value === form.unit_of_measure)
    ? UOM_OPTIONS
    : [...UOM_OPTIONS, { value: form.unit_of_measure, label: form.unit_of_measure }];
  const money = form.currency === "USD" ? "US$" : "S/";
  // No cost typed (or hidden by the API) reads «—», not a 100 % margin.
  const margin = marginPct(Number(form.unit_price), form.unit_cost.trim() === "" ? null : Number(form.unit_cost));
  const num = (key: ProductFormKey) => ({
    type: "number",
    inputMode: "numeric" as const,
    min: 0,
    step: 1,
    disabled,
    className: "[&_input]:font-mono",
    value: String(form[key]),
    error: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value),
  });

  return (
    <div className="space-y-8">
      <FormSection title="Datos básicos">
        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <ProductImagePicker value={form.image_url} onChange={(v) => onChange("image_url", v)} disabled={disabled} className="w-full max-w-[160px]" />
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <TextField
              label="Nombre"
              className="sm:col-span-2"
              value={form.name}
              disabled={disabled}
              error={errors.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Ej. Arena sanitaria para gato 10 kg"
              autoFocus={create}
            />
            <FieldShell label="Categoría" labelId={`${ids}-cat`} hint="Opcional. Sirve para filtrar y para los campos de cada tipo.">
              <Select
                aria-label="Categoría"
                value={form.category_id}
                options={catOptions}
                onChange={(v) => onChange("category_id", v)}
                disabled={disabled}
                searchable
                placeholder="Sin categoría"
              />
            </FieldShell>
            <div className="flex min-w-0 flex-col gap-2">
              <TextField
                label="Código de barras"
                hint={
                  create && skuFromBarcode && !showSku
                    ? "Opcional. Será también su código (SKU); sin él, te ponemos uno."
                    : "Opcional. Escanéalo o escríbelo."
                }
                prefix={<ScanBarcode aria-hidden className="h-4 w-4" />}
                className="[&_input]:font-mono"
                value={form.barcode}
                disabled={disabled}
                inputMode="numeric"
                onChange={(e) => onChange("barcode", e.target.value)}
                // Scanners type the code and press Enter: that must not submit the form.
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              />
              {!showSku && (
                <button
                  type="button"
                  onClick={() => setOwnSku(true)}
                  disabled={disabled}
                  className="self-start text-[13px] font-semibold text-accent-text hover:underline"
                >
                  Usar otro código (SKU)
                </button>
              )}
            </div>
            {showSku && (
              <TextField
                label="Código (SKU)"
                hint={
                  !create
                    ? "Cámbialo solo si usas otro código."
                    : skuFromBarcode
                      ? "Opcional. Si lo dejas vacío, usamos el código de barras."
                      : "Opcional. Si lo dejas vacío, te ponemos uno (P-000123)."
                }
                className="[&_input]:font-mono [&_input]:uppercase"
                value={form.sku}
                disabled={disabled}
                error={errors.sku}
                onChange={(e) => onChange("sku", e.target.value)}
                autoFocus={ownSku}
              />
            )}
            <div className="sm:col-span-2">
              <FieldShell label="Descripción" htmlFor={`${ids}-desc`} hint="Opcional. Presentación, sabor, talla, indicaciones.">
                <textarea
                  id={`${ids}-desc`}
                  className={cn(inputClass(), "h-auto resize-y py-2.5")}
                  rows={2}
                  value={form.description}
                  disabled={disabled}
                  onChange={(e) => onChange("description", e.target.value)}
                />
              </FieldShell>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Precio y costo">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Precio de venta"
            prefix={<span className="font-mono text-sm">{money}</span>}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="[&_input]:font-mono"
            value={form.unit_price}
            disabled={disabled}
            error={errors.unit_price}
            onChange={(e) => onChange("unit_price", e.target.value)}
            placeholder="0.00"
          />
          <TextField
            label={create ? "¿Cuánto te cuesta?" : "Costo promedio"}
            hint={create ? "Opcional." : lastCost != null ? `Se actualiza con cada compra. Última: ${soles(lastCost)}.` : "Se actualiza con cada compra."}
            prefix={<span className="font-mono text-sm">{money}</span>}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="[&_input]:font-mono"
            value={form.unit_cost}
            disabled={disabled}
            error={errors.unit_cost}
            onChange={(e) => onChange("unit_cost", e.target.value)}
            placeholder="0.00"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-secondary">Margen</span>
            <p
              className={cn(
                "flex h-12 items-center rounded-xl bg-surface-soft px-3.5 font-mono text-[15px]",
                margin == null ? "text-text-muted" : margin < 0 ? "text-danger" : "text-text-primary",
              )}
            >
              {margin == null ? "—" : percent(margin / 100, 1)}
            </p>
            {margin != null && margin < 0 && <p className="text-[12.5px] text-danger">Vendes por debajo de tu costo.</p>}
          </div>
          {priceSuggestion && Number(form.unit_price) !== priceSuggestion.value && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-primary-soft px-3.5 py-2.5 text-[13px] text-text-secondary sm:col-span-3">
              Con tu {formatNumber(priceSuggestion.markup)} % de ganancia, el precio sería{" "}
              <span className="font-mono font-semibold text-text-primary">{soles(priceSuggestion.value)}</span>
              <button
                type="button"
                onClick={() => onChange("unit_price", priceSuggestion.value.toFixed(2))}
                disabled={disabled}
                className="font-semibold text-accent-text hover:underline"
              >
                Usar este precio
              </button>
            </p>
          )}
          {create && (
            <FieldShell label="Moneda" labelId={`${ids}-cur`}>
              <Select aria-label="Moneda" value={form.currency} options={CURRENCY_OPTIONS} onChange={(v) => onChange("currency", v)} disabled={disabled} />
            </FieldShell>
          )}
        </div>
      </FormSection>

      <FormSection title="Inventario" description={create ? undefined : "Cambia con ventas, compras y ajustes. Aquí defines cuándo avisarte."}>
        {stockSlot}
        <div className="grid gap-4 sm:grid-cols-3">
          {create && <TextField label="¿Cuántos tienes hoy?" hint="Queda como inventario inicial." {...num("initial_stock")} placeholder="0" />}
          <TextField label="Inventario mínimo" hint="Por debajo de esto, está por acabarse." {...num("safety_stock")} />
          <TextField label="Comprar al llegar a" hint="Desde aquí te sugerimos comprar." {...num("reorder_point")} />
          <TextField label="Días que tarda el proveedor" hint="Desde que pides hasta que llega." {...num("lead_time_days")} />
          <FieldShell label="Unidad" labelId={`${ids}-uom`}>
            <Select aria-label="Unidad" value={form.unit_of_measure} options={uomOptions} onChange={(v) => onChange("unit_of_measure", v)} disabled={disabled} />
          </FieldShell>
        </div>
      </FormSection>

      {children}
    </div>
  );
}
