"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import type { CategoryDTO } from "@/types/api";
import { CUSTOM_FIELD_TYPE_LABEL, type CustomFieldDTO } from "@/types/custom-fields";
import { AlertBadges } from "./AlertBadges";
import { ColumnForm } from "./ColumnForm";
import { draftFromField, type ColumnDraft } from "./columnDraft";
import { patchFromDraft, type FieldPatch } from "./draftChecks";
import type { StorableEntity } from "./entities";
import { validationParts } from "./ruleText";
import { scopeLabel } from "./scope";

interface CustomFieldRowProps {
  field: CustomFieldDTO;
  entity: StorableEntity;
  /** Products only: categories for the scope picker. */
  categories: CategoryDTO[] | null;
  /** Other columns' names, to stop a duplicate on rename. */
  otherLabels: string[];
  busy: boolean;
  /** The API's answer to this row's last edit. */
  error: string | null;
  canUp: boolean;
  canDown: boolean;
  onMove: (dir: -1 | 1) => void;
  /** Resolves whether it was saved. */
  onUpdate: (patch: FieldPatch, message?: string) => Promise<boolean>;
  onDelete: () => void;
  onCreateCategory: (name: string) => Promise<CategoryDTO | null>;
}

/** One own column: its rules at a glance, show as a column, require, edit everything, delete. */
export function CustomFieldRow(props: CustomFieldRowProps) {
  const { field, entity, categories, otherLabels, busy, error, canUp, canDown, onMove, onUpdate, onDelete, onCreateCategory } = props;
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const alerts = entity === "product";

  const sub = [
    CUSTOM_FIELD_TYPE_LABEL[field.field_type],
    field.field_type === "select" && field.options.length ? field.options.join(", ") : null,
    categories ? scopeLabel(field, categories) : null,
    ...validationParts(field.field_type, field.rules?.validation),
  ]
    .filter(Boolean)
    .join(" · ");
  const alert = alerts ? field.rules?.alert : null;

  const save = async (d: ColumnDraft) => {
    const patch = patchFromDraft(field, d, { alerts, scoped: !!categories });
    if (Object.keys(patch).length === 0) return setEditing(false);
    if (await onUpdate(patch, `Guardaste los cambios de «${d.label.trim()}».`)) setEditing(false);
  };

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex flex-col">
          <button type="button" disabled={busy || !canUp} onClick={() => onMove(-1)} aria-label={`Subir «${field.label}» en la ficha`} className="grid h-5 w-7 place-items-center rounded text-text-muted hover:text-text-primary disabled:opacity-30">
            <ChevronUp aria-hidden className="h-3.5 w-3.5" />
          </button>
          <button type="button" disabled={busy || !canDown} onClick={() => onMove(1)} aria-label={`Bajar «${field.label}» en la ficha`} className="grid h-5 w-7 place-items-center rounded text-text-muted hover:text-text-primary disabled:opacity-30">
            <ChevronDown aria-hidden className="h-3.5 w-3.5" />
          </button>
        </span>
        <div className="min-w-[180px] flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="truncate">{field.label}</span>
            {alert && <AlertBadges alerts={[{ key: field.key, column: field.label, label: alert.label, tone: alert.tone }]} withColumn={false} />}
          </p>
          <p className="text-[12.5px] text-text-muted">{sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Switch showLabel label="Columna" checked={field.is_visible} disabled={busy} onChange={(v) => void onUpdate({ is_visible: v })} />
          <Switch showLabel label="Obligatoria" checked={field.is_required} disabled={busy} onChange={(v) => void onUpdate({ is_required: v })} />
          <div className="flex flex-wrap items-center gap-1">
            <Button size="sm" variant={editing ? "secondary" : "ghost"} aria-expanded={editing} onClick={() => setEditing((o) => !o)}>
              Editar
            </Button>
            {confirming ? (
              <>
                <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>
                  Sí, eliminar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  No
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>
      {editing && (
        <ColumnForm
          className="pop-in bg-surface-soft sm:ml-10"
          initial={draftFromField(field)}
          entity={entity}
          takenLabels={otherLabels}
          categories={categories}
          onCreateCategory={onCreateCategory}
          typeLocked
          submitLabel="Guardar cambios"
          busy={busy}
          error={error}
          autoFocus
          onSubmit={save}
          onCancel={() => setEditing(false)}
          note="Las reglas nuevas se aplican a lo que guardes desde ahora; lo ya guardado se mantiene."
        />
      )}
    </li>
  );
}
