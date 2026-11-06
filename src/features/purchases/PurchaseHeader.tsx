"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { inputClass } from "@/lib/ui";
import { purchaseDateError, todayISO } from "./format";

export interface PurchaseHeaderState {
  supplierId: string;
  date: string;
  docNumber: string;
  notes: string;
  includeIgv: boolean;
}

interface Props {
  value: PurchaseHeaderState;
  onChange: (patch: Partial<PurchaseHeaderState>) => void;
  supplierOptions: SelectOption[];
  showErrors: boolean;
  onNewSupplier: () => void;
}

/** Who sold it, when, and the supplier's document number. */
export function PurchaseHeader({ value, onChange, supplierOptions, showErrors, onNewSupplier }: Props) {
  const supplierMissing = showErrors && !value.supplierId;
  const dateError = showErrors ? purchaseDateError(value.date) : null;

  return (
    <section aria-labelledby="purchase-header-title" className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <h2 id="purchase-header-title" className="text-[15px] font-semibold text-text-primary">
        ¿A quién le compraste?
      </h2>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">
            Proveedor
          </span>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Select
                aria-label="Proveedor"
                value={value.supplierId}
                onChange={(supplierId) => onChange({ supplierId })}
                options={supplierOptions}
                searchable
                placeholder={supplierOptions.length ? "Busca por nombre o RUC" : "Aún no tienes proveedores"}
                invalid={supplierMissing}
                emptyText="Ningún proveedor coincide"
              />
            </div>
            <Button variant="secondary" onClick={onNewSupplier} className="shrink-0" aria-label="Nuevo proveedor" title="Nuevo proveedor">
              <UserPlus aria-hidden className="h-4 w-4" /> <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </div>
          {supplierMissing && <p className="text-[12.5px] text-danger">Elige a quién le compraste.</p>}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">Fecha de la compra</span>
          <DateField invalid={!!dateError} value={value.date} max={todayISO()} onChange={(date) => onChange({ date })} />
          {dateError && <span className="text-[12.5px] text-danger">{dateError}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">N.º de factura o boleta (opcional)</span>
          <input
            className={inputClass(false, "font-mono")}
            value={value.docNumber}
            onChange={(e) => onChange({ docNumber: e.target.value.toUpperCase() })}
            placeholder="F001-000123"
            maxLength={40}
          />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">Notas (opcional)</span>
          <input
            className={inputClass()}
            value={value.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Ej. pagado al contado, llegó incompleto"
            maxLength={500}
          />
        </label>
        <div className="flex items-center gap-3 rounded-xl bg-surface-soft px-4 py-2.5">
          <Switch checked={value.includeIgv} onChange={(includeIgv) => onChange({ includeIgv })} label="Los costos de la factura incluyen IGV" />
          <span className="text-sm">
            <span className="block font-semibold text-text-primary">Los costos incluyen IGV</span>
            <span className="block text-[12px] text-text-muted">Actívalo si copias los precios con IGV; lo separamos por ti.</span>
          </span>
        </div>
      </div>
    </section>
  );
}
