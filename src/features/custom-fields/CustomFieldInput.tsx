"use client";

import { Select } from "@/components/ui/Select";
import { DateField } from "@/components/ui/DateField";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { limaToday } from "./rules";
import { asBoolean } from "./values";

export { asBoolean, formatCustomValue } from "./values";

type Value = string | number | boolean | null | undefined;

interface CustomFieldInputProps {
  field: CustomFieldDTO;
  value: Value;
  onChange: (value: string | number | boolean | null) => void;
  /** Ties the control to a visible <label htmlFor>. */
  id?: string;
  invalid?: boolean;
  /** Message element announced with the control. */
  describedBy?: string;
  disabled?: boolean;
  /** Leaving the control (to check its value then, not while typing). */
  onBlur?: () => void;
}

const PLACEHOLDER = { letters: "Solo letras", letters_numbers: "Letras y números", digits: "Solo dígitos", email: "nombre@correo.com" } as const;

/**
 * Form control for one custom field, picked by its type. The column's rules shape it too:
 * digits open the number pad, a max length stops typing, dates outside the limit are greyed out.
 */
export function CustomFieldInput({ field, value, onChange, id, invalid, describedBy, disabled, onBlur }: CustomFieldInputProps) {
  const v = field.rules?.validation ?? {};
  const common = {
    id,
    disabled,
    onBlur,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };
  switch (field.field_type) {
    case "boolean":
      return (
        <Select
          aria-label={field.label}
          disabled={disabled}
          invalid={invalid}
          value={asBoolean(value) === true ? "true" : asBoolean(value) === false ? "false" : ""}
          placeholder="Sin responder"
          options={[
            { value: "true", label: "Sí" },
            { value: "false", label: "No" },
          ]}
          onChange={(x) => onChange(x === "true")}
        />
      );
    case "select":
      return (
        <Select
          aria-label={field.label}
          disabled={disabled}
          invalid={invalid}
          value={value == null ? "" : String(value)}
          placeholder="Elige una opción"
          options={field.options.map((o) => ({ value: o, label: o }))}
          onChange={(x) => onChange(x)}
        />
      );
    case "number":
    case "currency": {
      const step = v.integer_only || v.decimals === 0 ? "1" : v.decimals ? String(10 ** -v.decimals) : field.field_type === "currency" ? "0.01" : "any";
      const money = field.field_type === "currency";
      return (
        <div className={cn("relative", money && "[&_input]:pl-10")}>
          {money && (
            <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">
              S/
            </span>
          )}
          <input
            {...common}
            type="number"
            inputMode={v.integer_only || v.decimals === 0 ? "numeric" : "decimal"}
            min={v.min}
            max={v.max}
            step={step}
            className={inputClass(invalid, "font-mono")}
            value={value == null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          />
        </div>
      );
    }
    case "date": {
      const today = v.date_limit ? limaToday() : undefined;
      return (
        <DateField
          id={id}
          disabled={disabled}
          invalid={invalid}
          onBlur={onBlur}
          aria-label={field.label}
          aria-describedby={describedBy}
          clearable
          max={v.date_limit === "not_future" ? today : undefined}
          min={v.date_limit === "not_past" ? today : undefined}
          value={value == null ? "" : String(value)}
          onChange={(day) => onChange(day || null)}
        />
      );
    }
    default: {
      const only = field.field_type === "text" ? v.only : undefined;
      return (
        <input
          {...common}
          type={field.field_type === "url" ? "url" : only === "email" ? "email" : "text"}
          inputMode={only === "digits" ? "numeric" : only === "email" ? "email" : undefined}
          maxLength={v.max_length}
          placeholder={only ? PLACEHOLDER[only] : field.field_type === "url" ? "https://" : undefined}
          className={inputClass(invalid, only === "digits" ? "font-mono" : undefined)}
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
  }
}
