"use client";

import { Dispatch, ReactNode, SetStateAction, useId, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { FieldShell } from "@/features/products/FormBits";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/api";
import { CUSTOM_FIELD_TYPE_LABEL, type CustomFieldType } from "@/types/custom-fields";
import { AlertEditor } from "./AlertEditor";
import { RulePreview } from "./RulePreview";
import { ScopePicker } from "./ScopePicker";
import { ValidationEditor } from "./ValidationEditor";
import { hasAdvanced, toAlert, toValidation, withType, type ColumnDraft, type ColumnDraftErrors } from "./columnDraft";
import { ENTITY_LABEL, type StorableEntity } from "./entities";
import { validationParts } from "./ruleText";

interface ColumnEditorProps {
  draft: ColumnDraft;
  /** A state setter: updates may come in pairs within one event (scope mode, then its ids). */
  onChange: Dispatch<SetStateAction<ColumnDraft>>;
  /** Already filtered: only shown after the first save attempt. */
  errors: ColumnDraftErrors;
  entity: StorableEntity;
  /** Editing a saved column: its type cannot change (stored values would not fit). */
  typeLocked?: boolean;
  /** Products only: offers «Para qué productos». Null or missing hides it. */
  categories?: CategoryDTO[] | null;
  onCreateCategory?: (name: string) => Promise<CategoryDTO | null>;
  autoFocus?: boolean;
  /** Extra controls at the end of «Qué se puede guardar». */
  extra?: ReactNode;
}

const TYPE_HINT: Record<CustomFieldType, string> = {
  text: "Marca, color, lote",
  number: "Garantía en meses, peso",
  currency: "Precio por mayor, flete",
  boolean: "Requiere receta, es importado",
  date: "Vencimiento, fecha de ingreso",
  select: "Talla: S, M, L",
  url: "Ficha del fabricante",
};
const TYPE_OPTIONS = (Object.keys(CUSTOM_FIELD_TYPE_LABEL) as CustomFieldType[]).map((t) => ({
  value: t,
  label: CUSTOM_FIELD_TYPE_LABEL[t],
  description: TYPE_HINT[t],
}));
const ADVANCED_KEYS = ["scope", "max_length", "min", "max", "alert_value", "alert_days", "alert_label"] as const;

/**
 * The one column editor (onboarding, Inventario and Configuración): name and type up front;
 * behind «Configuración avanzada», what can be saved, for which products and when to warn,
 * with a live try-out beside it. Controlled, and not a <form>: callers decide how to submit.
 */
export function ColumnEditor({ draft, onChange, errors, entity, typeLocked, categories, onCreateCategory, autoFocus, extra }: ColumnEditorProps) {
  const ids = useId();
  const [open, setOpen] = useState(() => hasAdvanced(draft) || draft.is_required || draft.scope === "some");
  // A mistake inside the advanced part opens it, so the message is never hidden.
  const shown = open || ADVANCED_KEYS.some((k) => errors[k]);
  const alertsAllowed = entity === "product";
  const set = (patch: Partial<ColumnDraft>) => onChange((d) => ({ ...d, ...patch }));

  const alert = alertsAllowed ? toAlert(draft) : null;
  const summary = [
    draft.is_required && "Obligatoria",
    ...validationParts(draft.field_type, toValidation(draft)),
    categories && draft.scope === "some" && draft.category_ids.length > 0 && `Solo ${draft.category_ids.length === 1 ? "1 categoría" : `${draft.category_ids.length} categorías`}`,
    alert && `Aviso: ${alert.label}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <TextField
          label="Nombre de la columna"
          value={draft.label}
          maxLength={120}
          placeholder={entity === "product" ? "Ej. Talla, Lote, Vencimiento" : "Ej. Banco, N.º de cuenta"}
          error={errors.label}
          autoFocus={autoFocus}
          onChange={(e) => set({ label: e.target.value })}
        />
        <FieldShell label="Tipo de dato" hint={typeLocked ? "No se cambia: los datos guardados dejarían de encajar." : undefined}>
          <Select<CustomFieldType> aria-label="Tipo de dato" value={draft.field_type} options={TYPE_OPTIONS} disabled={typeLocked} onChange={(t) => onChange((d) => (d.field_type === t ? d : withType(d, t)))} />
        </FieldShell>
      </div>
      {draft.field_type === "select" && (
        <TextField
          label="Opciones"
          hint="Sepáralas con comas. Ej. S, M, L, XL"
          value={draft.options}
          error={errors.options}
          onChange={(e) => set({ options: e.target.value })}
        />
      )}

      <div className="rounded-2xl border border-border">
        <button
          type="button"
          aria-expanded={shown}
          aria-controls={`${ids}-adv`}
          onClick={() => setOpen(!shown)}
          className="flex w-full min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-soft"
        >
          <SlidersHorizontal aria-hidden className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-text-primary">Configuración avanzada</span>
            <span className="block truncate text-[12.5px] text-text-muted">
              {summary.length ? summary.join(" · ") : "Opcional: qué se puede guardar, si es obligatoria y cuándo avisarte."}
            </span>
          </span>
          <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-text-muted motion-safe:transition-transform", shown && "rotate-180")} />
        </button>

        {shown && (
          <div id={`${ids}-adv`} className="pop-in grid gap-6 border-t border-border p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5">
            <div className="min-w-0 space-y-6">
              <section aria-labelledby={`${ids}-val`} className="space-y-4">
                <h4 id={`${ids}-val`} className="text-[14px] font-semibold text-text-primary">
                  Qué se puede guardar
                </h4>
                <div className="space-y-1">
                  <Switch showLabel label="Obligatoria" checked={draft.is_required} onChange={(is_required) => set({ is_required })} />
                  <p className="text-[12.5px] text-text-muted">
                    bria la pide al crear o editar un {ENTITY_LABEL[entity].one}. Las importaciones de Excel no la exigen.
                  </p>
                </div>
                <ValidationEditor draft={draft} errors={errors} onChange={(validation) => set({ validation })} />
                {extra}
              </section>

              {categories && (
                <section aria-labelledby={`${ids}-scope`} className="space-y-3 border-t border-border pt-5">
                  <h4 id={`${ids}-scope`} className="text-[14px] font-semibold text-text-primary">
                    Para qué productos
                  </h4>
                  <ScopePicker
                    categories={categories}
                    value={draft.category_ids}
                    mode={draft.scope}
                    onModeChange={(scope) => set({ scope })}
                    onChange={(category_ids) => set({ category_ids })}
                    onCreateCategory={onCreateCategory}
                  />
                  {errors.scope && <p className="text-[12.5px] text-danger">{errors.scope}</p>}
                </section>
              )}

              {alertsAllowed && (
                <section className="border-t border-border pt-5">
                  <AlertEditor draft={draft} errors={errors} onChange={(next) => set({ alert: next })} />
                </section>
              )}
            </div>
            <aside className="min-w-0 self-start lg:sticky lg:top-4">
              <RulePreview draft={draft} alertsAllowed={alertsAllowed} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
