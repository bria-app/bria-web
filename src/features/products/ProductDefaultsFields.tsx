"use client";

import { useId } from "react";
import { Hash, ScanBarcode } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";
import { FieldShell } from "./FormBits";
import { UOM_OPTIONS } from "./productForm";
import type { ProductDefaults } from "./productDefaults";

interface ProductDefaultsFieldsProps {
  value: ProductDefaults;
  onChange: (next: ProductDefaults) => void;
  disabled?: boolean;
}

const SKU_CHOICES = [
  { on: true, icon: ScanBarcode, title: "Sí, uso código de barras", text: "Será también su código (SKU): escaneas y buscas con el mismo número." },
  { on: false, icon: Hash, title: "No, pon códigos automáticos", text: "Cada producto recibe uno correlativo: P-000001, P-000002…" },
];

const whole = (s: string) => Math.max(0, Math.floor(Number(s) || 0));

/** The questions behind the product defaults; shared by the first product and Configuración. */
export function ProductDefaultsFields({ value, onChange, disabled }: ProductDefaultsFieldsProps) {
  const ids = useId();
  const set = <K extends keyof ProductDefaults>(key: K, v: ProductDefaults[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[14px] font-semibold text-text-primary">¿Tus productos tienen código de barras?</legend>
        <div role="radiogroup" aria-label="¿Tus productos tienen código de barras?" className="grid gap-2 sm:grid-cols-2">
          {SKU_CHOICES.map((c) => {
            const on = value.barcode_as_sku === c.on;
            return (
              <button
                key={c.title}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled}
                onClick={() => set("barcode_as_sku", c.on)}
                className={cn(
                  "flex gap-3 rounded-2xl border bg-surface p-3.5 text-left transition-colors",
                  on ? "border-strong ring-1 ring-strong" : "border-border hover:border-text-muted/50",
                )}
              >
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", on ? "bg-strong text-strong-foreground" : "bg-surface-muted text-text-secondary")}>
                  <c.icon aria-hidden className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-text-primary">{c.title}</span>
                  <span className="block text-[12.5px] leading-snug text-text-muted">{c.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="¿En qué unidad vendes casi todo?" labelId={`${ids}-uom`} hint="La cambias en cada producto si hace falta.">
          <Select
            aria-label="Unidad más usada"
            value={value.unit_of_measure}
            options={UOM_OPTIONS}
            onChange={(v) => set("unit_of_measure", v)}
            disabled={disabled}
          />
        </FieldShell>
        <TextField
          label="¿Cuándo te avisamos que algo se acaba?"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          suffix={<span className="pr-1 text-[13px] text-text-muted">unidades</span>}
          hint="Al quedar esta cantidad o menos."
          className="[&_input]:font-mono"
          value={String(value.safety_stock)}
          disabled={disabled}
          onChange={(e) => set("safety_stock", whole(e.target.value))}
        />
        <TextField
          label="¿Cuántos días tarda tu proveedor?"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          suffix={<span className="pr-1 text-[13px] text-text-muted">días</span>}
          hint="Desde que pides hasta que llega, lo normal."
          className="[&_input]:font-mono"
          value={String(value.lead_time_days)}
          disabled={disabled}
          onChange={(e) => set("lead_time_days", whole(e.target.value))}
        />
        <TextField
          label="¿Cuánto le ganas a lo que compras?"
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          suffix={<span className="pr-1 text-[13px] text-text-muted">%</span>}
          hint="Opcional. Con esto te sugerimos el precio desde el costo."
          className="[&_input]:font-mono"
          placeholder="Ej. 30"
          value={value.markup_pct == null ? "" : String(value.markup_pct)}
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value);
            set("markup_pct", e.target.value.trim() && n > 0 && n < 1000 ? n : null);
          }}
        />
      </div>
    </div>
  );
}
