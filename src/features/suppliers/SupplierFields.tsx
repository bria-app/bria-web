"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/Badge";
import { TextField } from "@/components/ui/TextField";
import { CustomFieldInput } from "@/features/custom-fields/CustomFieldInput";
import { FieldShell } from "@/features/products/FormBits";
import type { CustomFieldDTO } from "@/types/custom-fields";
import type { SupplierDraft, TextKey } from "./draft";
import { rucKind } from "./ruc";

interface MainProps {
  draft: SupplierDraft;
  onChange: (patch: Partial<SupplierDraft>) => void;
  /** Errors to show now (the parent decides when: on blur or on submit). */
  errors: Record<string, string>;
  /** The RUC is set once, on create; the backend does not let it change. */
  rucEditable: boolean;
  onBlur?: (field: string) => void;
}

/** RUC, razón social and contact data. */
export function SupplierMainFields({ draft, onChange, errors, rucEditable, onBlur }: MainProps) {
  const text = (key: TextKey, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <TextField
      label={label}
      value={draft[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      onBlur={() => onBlur?.(key)}
      error={errors[key]}
      {...extra}
    />
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rucEditable ? (
        <TextField
          label="RUC"
          value={draft.ruc}
          onChange={(e) => onChange({ ruc: e.target.value.replace(/\D/g, "").slice(0, 11) })}
          onBlur={() => onBlur?.("ruc")}
          error={errors.ruc}
          hint={!errors.ruc && draft.ruc.length === 11 ? rucKind(draft.ruc) : "11 dígitos; empieza con 10, 15, 17 o 20."}
          inputMode="numeric"
          autoComplete="off"
          placeholder="20512345671"
          className="[&_input]:font-mono"
          autoFocus
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-secondary">RUC</span>
          <span className="flex h-12 items-center rounded-xl bg-surface-soft px-3.5 font-mono text-[15px] text-text-primary">{draft.ruc}</span>
          <span className="text-[12.5px] text-text-muted">El RUC no se puede cambiar.</span>
        </div>
      )}
      {text("business_name", "Razón social o nombre", { placeholder: "Distribuidora Andina S.A.C." })}
      {text("contact_name", "Persona de contacto (opcional)", { placeholder: "Nombre de tu vendedor" })}
      {text("phone", "Teléfono (opcional)", { placeholder: "987 654 321", inputMode: "tel", className: "[&_input]:font-mono" })}
      {text("email", "Correo (opcional)", { placeholder: "ventas@proveedor.pe", type: "email", inputMode: "email" })}
      {text("address", "Dirección (opcional)", { placeholder: "Av. Argentina 123, Lima" })}
    </div>
  );
}

interface CustomProps {
  fields: CustomFieldDTO[];
  values: SupplierDraft["custom"];
  onChange: (key: string, value: string | number | boolean | null) => void;
  errors: Record<string, string>;
}

/** The company's own supplier fields (banco, N.º de cuenta…). */
export function SupplierCustomFields({ fields, values, onChange, errors }: CustomProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <CustomField key={f.id} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} error={errors[`custom:${f.key}`]} />
      ))}
    </div>
  );
}

function CustomField({
  field,
  value,
  onChange,
  error,
}: {
  field: CustomFieldDTO;
  value: SupplierDraft["custom"][string] | undefined;
  onChange: (v: string | number | boolean | null) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <FieldShell
      label={field.label}
      htmlFor={id}
      hint={field.is_required ? undefined : "Opcional."}
      error={error}
      messageId={`${id}-msg`}
      badge={
        <Badge tone="accent" className="px-1.5 py-0 text-[10px]">
          Propio
        </Badge>
      }
    >
      <CustomFieldInput id={id} field={field} value={value} invalid={!!error} describedBy={`${id}-msg`} onChange={onChange} />
    </FieldShell>
  );
}
