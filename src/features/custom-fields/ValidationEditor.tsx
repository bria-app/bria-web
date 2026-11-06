"use client";

import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { FieldShell } from "@/features/products/FormBits";
import type { DateLimit, TextOnly } from "@/types/custom-fields";
import type { ColumnDraft, ColumnDraftErrors, ValidationDraft } from "./columnDraft";

interface ValidationEditorProps {
  draft: ColumnDraft;
  onChange: (next: ValidationDraft) => void;
  errors: ColumnDraftErrors;
}

const ONLY_OPTIONS: { value: TextOnly | "any"; label: string; description?: string }[] = [
  { value: "any", label: "Cualquier texto" },
  { value: "letters", label: "Solo letras", description: "Con tildes y ñ. Sin números ni símbolos." },
  { value: "letters_numbers", label: "Letras y números", description: "Sin guiones ni símbolos." },
  { value: "digits", label: "Solo dígitos (0-9)", description: "Códigos, DNI. Sin espacios." },
  { value: "email", label: "Un correo", description: "nombre@correo.com" },
];

const DATE_OPTIONS: { value: DateLimit | "any"; label: string }[] = [
  { value: "any", label: "Cualquier fecha" },
  { value: "not_future", label: "Hasta hoy" },
  { value: "not_past", label: "Desde hoy" },
];

const DATE_HINT: Record<DateLimit | "any", string> = {
  any: "Pasada, de hoy o futura.",
  not_future: "No acepta fechas futuras. Ej. fecha de compra o de ingreso.",
  not_past: "No acepta fechas pasadas. Ej. vencimiento de lo que recién llega.",
};

/** «Qué se puede guardar»: the checks that fit the column type. */
export function ValidationEditor({ draft, onChange, errors }: ValidationEditorProps) {
  const v = draft.validation;
  const set = (patch: Partial<ValidationDraft>) => onChange({ ...v, ...patch });
  const type = draft.field_type;

  if (type === "text" || type === "url") {
    return (
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        {type === "text" ? (
          <FieldShell label="Admite" hint={ONLY_OPTIONS.find((o) => o.value === (v.only || "any"))?.description ?? "Letras, números y símbolos."}>
            <Select<TextOnly | "any"> aria-label="Qué admite" value={v.only || "any"} options={ONLY_OPTIONS} onChange={(x) => set({ only: x === "any" ? "" : x })} />
          </FieldShell>
        ) : (
          <p className="self-center text-[13px] text-text-muted">Un enlace guarda una dirección web, como https://tutienda.pe/producto.</p>
        )}
        <TextField
          label="Máximo de caracteres"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          placeholder="Sin límite"
          className="[&_input]:font-mono"
          value={v.max_length}
          error={errors.max_length}
          onChange={(e) => set({ max_length: e.target.value })}
        />
      </div>
    );
  }

  if (type === "number" || type === "currency") {
    const money = type === "currency";
    const maxDecimals = money ? 2 : 6;
    const decimals = [
      { value: "any", label: money ? "Hasta 2 (céntimos)" : "Los que escriban" },
      ...Array.from({ length: maxDecimals + 1 }, (_, i) => ({ value: String(i), label: i === 0 ? "Ninguno" : `Hasta ${i}` })),
    ].filter((o) => !(money && o.value === "2"));
    const prefix = money ? <span className="font-mono text-sm">S/</span> : undefined;
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Mínimo" inputMode="decimal" placeholder="Sin mínimo" prefix={prefix} className="[&_input]:font-mono" value={v.min} error={errors.min} onChange={(e) => set({ min: e.target.value })} />
          <TextField label="Máximo" inputMode="decimal" placeholder="Sin máximo" prefix={prefix} className="[&_input]:font-mono" value={v.max} error={errors.max} onChange={(e) => set({ max: e.target.value })} />
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <div className="flex min-h-12 items-center">
            <Switch showLabel label="Solo números enteros" checked={v.integer_only} onChange={(x) => set({ integer_only: x, decimals: x ? "" : v.decimals })} />
          </div>
          {!v.integer_only && (
            <FieldShell label="Decimales">
              <Select aria-label="Decimales" value={v.decimals || "any"} options={decimals} onChange={(x) => set({ decimals: x === "any" ? "" : x })} />
            </FieldShell>
          )}
        </div>
      </div>
    );
  }

  if (type === "date") {
    const value = v.date_limit || "any";
    return (
      <div className="space-y-1.5">
        <p className="text-[13px] font-semibold text-text-secondary">
          Fechas permitidas
        </p>
        <Segmented<DateLimit | "any"> label="Fechas permitidas" size="sm" value={value} options={DATE_OPTIONS} onChange={(x) => set({ date_limit: x === "any" ? "" : x })} />
        <p className="text-[12.5px] text-text-muted">{DATE_HINT[value]} Hoy siempre se puede.</p>
      </div>
    );
  }

  return (
    <p className="text-[13px] text-text-muted">
      {type === "boolean" ? "Una columna Sí / No solo guarda Sí o No." : "Solo se puede guardar una de las opciones de la lista."}
    </p>
  );
}
