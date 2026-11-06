"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { AlertBadges } from "@/features/custom-fields/AlertBadges";
import { CustomFieldInput } from "@/features/custom-fields/CustomFieldInput";
import { QuickFieldForm } from "@/features/custom-fields/QuickFieldForm";
import { validationParts } from "@/features/custom-fields/ruleText";
import { alertFires, limaToday } from "@/features/custom-fields/rules";
import { Badge } from "@/components/ui/Badge";
import type { CustomAttributes, CustomFieldDTO } from "@/types/custom-fields";
import { FieldShell, FormSection } from "./FormBits";
import { customFieldError, type ProductFormErrors } from "./productForm";

interface ProductCustomFieldsProps {
  /** Fields that apply to the product's category. */
  fields: CustomFieldDTO[];
  /** How many other fields exist for other categories (shown as a hint). */
  otherCount: number;
  categoryName?: string;
  values: CustomAttributes;
  /** Saved values (edit): unchanged ones are not re-checked against newer rules. */
  original?: CustomAttributes;
  errors: ProductFormErrors;
  onChange: (key: string, value: CustomAttributes[string]) => void;
  disabled?: boolean;
  /** Opens the custom-fields manager. */
  onManage?: () => void;
  /** Lets the person create a new field right here (it becomes an inventory and Excel column too). */
  quickAdd?: {
    companyId: string;
    takenLabels: string[];
    category: { id: string; name: string } | null;
    onCreated: (field: CustomFieldDTO) => void;
  };
}

/** «Rules at a glance» under each own column: «Obligatoria · Solo dígitos (0-9)». */
const hintFor = (field: CustomFieldDTO) => [field.is_required ? "Obligatoria" : "Opcional", ...validationParts(field.field_type, field.rules?.validation)].join(" · ") + ".";

/** «Tus columnas»: the company's own product columns, filtered by category, with their rules and alerts. */
export function ProductCustomFields({
  fields,
  otherCount,
  categoryName,
  values,
  original,
  errors,
  onChange,
  disabled,
  onManage,
  quickAdd,
}: ProductCustomFieldsProps) {
  const ids = useId();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  // A rule is checked when the person leaves the control, not while typing.
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const today = limaToday();
  if (fields.length === 0 && otherCount === 0 && !onManage && !quickAdd) return null;

  const scope = categoryName ? `Las de la categoría «${categoryName}» y las de todos los productos.` : "Las que aplican a todos los productos.";
  const others = otherCount > 0 ? ` Hay ${otherCount} más para otras categorías.` : "";

  return (
    <FormSection
      title="Tus columnas"
      description={
        fields.length ? scope + others : "Guarda lo que quieras de cada producto: talla, color, lote, vencimiento." + others
      }
      action={
        <div className="flex flex-wrap items-center gap-3">
          {quickAdd && !adding && (
            <button
              type="button"
              onClick={() => {
                setAdded(null);
                setAdding(true);
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text hover:underline"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" /> Crear una columna
            </button>
          )}
          {onManage && (
            <button type="button" onClick={onManage} className="text-[13px] font-semibold text-text-secondary hover:underline">
              Administrar columnas
            </button>
          )}
        </div>
      }
    >
      {quickAdd && adding && (
        <QuickFieldForm
          companyId={quickAdd.companyId}
          takenLabels={quickAdd.takenLabels}
          category={quickAdd.category}
          onCancel={() => setAdding(false)}
          onCreated={(field) => {
            setAdding(false);
            setAdded(field.label);
            quickAdd.onCreated(field);
          }}
        />
      )}
      {added && (
        <p role="status" className="rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] text-success">
          Listo: creaste «{added}». Llénala abajo; también aparece en tu inventario y en tu plantilla de Excel.
        </p>
      )}
      {fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const id = `${ids}-${field.key}`;
            const value = values[field.key];
            const error = errors[`custom:${field.key}`] ?? (touched.has(field.key) ? customFieldError(field, value, original) : undefined);
            const alert = field.rules?.alert;
            const fires = !!alert && !error && alertFires(field.field_type, alert, value, today);
            return (
              <FieldShell
                key={field.id}
                label={field.label}
                htmlFor={id}
                hint={hintFor(field)}
                error={error}
                messageId={`${id}-msg`}
                badge={
                  <>
                    <Badge tone="accent" className="px-1.5 py-0 text-[10px]">Propia</Badge>
                    {fires && <AlertBadges alerts={[{ key: field.key, column: field.label, label: alert.label, tone: alert.tone }]} withColumn={false} />}
                  </>
                }
              >
                <CustomFieldInput
                  id={id}
                  field={field}
                  value={value}
                  invalid={!!error}
                  describedBy={`${id}-msg`}
                  disabled={disabled}
                  onBlur={() => setTouched((t) => (t.has(field.key) ? t : new Set(t).add(field.key)))}
                  onChange={(v) => onChange(field.key, v)}
                />
              </FieldShell>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}
