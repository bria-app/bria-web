"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { DataState } from "@/components/ui/DataState";
import { InlineNotice, type Notice } from "@/components/ui/InlineNotice";
import { useApi } from "@/hooks/useApi";
import { categoriesApi } from "@/services/api/resources";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CategoryDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { ColumnForm } from "./ColumnForm";
import { CustomFieldRow } from "./CustomFieldRow";
import { blankDraft, parseOptions, toRules, type ColumnDraft } from "./columnDraft";
import type { FieldPatch } from "./draftChecks";
import { ENTITY_LABEL, type StorableEntity } from "./entities";

interface CustomFieldsManagerProps {
  companyId: string | null;
  initialEntity?: StorableEntity;
  /** Called after any change, with the entity that changed. */
  onChanged?: (entity: StorableEntity) => void;
}

const ENTITY_OPTIONS = (Object.keys(ENTITY_LABEL) as StorableEntity[]).map((e) => ({ value: e, label: ENTITY_LABEL[e].plural }));

/**
 * «Columnas de: Productos / Proveedores». The company's own fields for one entity at a time,
 * with the entity always named in the header so it is clear what is being edited.
 */
export function CustomFieldsManager({ companyId, initialEntity = "product", onChanged }: CustomFieldsManagerProps) {
  const [entity, setEntity] = useState<StorableEntity>(initialEntity);
  const [busy, setBusy] = useState(false);
  // Which part failed: a row being edited, the new-column form, or the list (null).
  const [error, setErrorState] = useState<{ target: string | null; message: string } | null>(null);
  const setError = (message: string | null, target: string | null = null) => setErrorState(message ? { target, message } : null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);

  const fieldsQ = useApi(() => (companyId ? customFieldsApi.list(companyId, entity) : Promise.resolve([] as CustomFieldDTO[])), [companyId, entity]);
  const categoriesQ = useApi(
    () => (companyId && entity === "product" ? categoriesApi.list(companyId) : Promise.resolve([] as CategoryDTO[])),
    [companyId, entity],
  );
  const fields = fieldsQ.data ?? [];
  const categories = entity === "product" ? categoriesQ.data ?? [] : null;

  /** Runs one change, refreshes and reports it. Returns whether it worked. */
  const run = async (fn: (cid: string) => Promise<unknown>, message?: string, undo?: (cid: string) => Promise<unknown>, target: string | null = null) => {
    if (!companyId) return false;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn(companyId);
      fieldsQ.reload();
      onChanged?.(entity);
      if (message) setNotice({ message, undo: undo ? () => void run(undo, "Listo, lo deshicimos.") : undefined });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.", target);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createCategory = async (name: string) => {
    if (!companyId) return null;
    try {
      const cat = await categoriesApi.create(companyId, { name });
      categoriesQ.reload();
      return cat;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la categoría.");
      return null;
    }
  };

  const create = async (d: ColumnDraft) => {
    let createdId = "";
    const label = d.label.trim();
    const ok = await run(
      async (cid) => {
        const created = await customFieldsApi.create(cid, {
          entity,
          label,
          field_type: d.field_type,
          options: d.field_type === "select" ? parseOptions(d.options) : [],
          is_required: d.is_required,
          category_ids: categories && d.scope === "some" ? d.category_ids : [],
          rules: toRules(d, entity === "product"),
        });
        createdId = created.id;
      },
      `Creaste «${label}» en ${ENTITY_LABEL[entity].plural.toLowerCase()}.`,
      (cid) => customFieldsApi.remove(cid, createdId),
      "new",
    );
    if (ok) setFormKey((k) => k + 1);
    return ok;
  };

  const update = (f: CustomFieldDTO, patch: FieldPatch, message?: string) => {
    const before = Object.fromEntries(Object.keys(patch).map((k) => [k, f[k as keyof FieldPatch]])) as FieldPatch;
    return run((cid) => customFieldsApi.update(cid, f.id, patch), message, message ? (cid) => customFieldsApi.update(cid, f.id, before) : undefined, f.id);
  };

  // Deleting a definition keeps the values stored in each record; creating it again with
  // the same name brings them back, which is what «Deshacer» does.
  const remove = (f: CustomFieldDTO) =>
    run(
      (cid) => customFieldsApi.remove(cid, f.id),
      `Eliminaste «${f.label}». Los datos guardados no se pierden si lo vuelves a crear.`,
      async (cid) => {
        const again = await customFieldsApi.create(cid, {
          entity,
          label: f.label,
          field_type: f.field_type,
          options: f.options,
          is_required: f.is_required,
          category_ids: f.category_ids,
          rules: f.rules,
        });
        if (!f.is_visible) await customFieldsApi.update(cid, again.id, { is_visible: false });
      },
    );

  const move = (index: number, dir: -1 | 1) => {
    const ids = fields.map((f) => f.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    void run((cid) => customFieldsApi.reorder(cid, entity, ids));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-text-primary">Columnas de:</h2>
        <Segmented<StorableEntity>
          label="Columnas de"
          value={entity}
          options={ENTITY_OPTIONS}
          onChange={(e) => {
            setEntity(e);
            setError(null);
            setNotice(null);
          }}
        />
      </div>
      <p className="-mt-2 text-sm text-text-secondary">
        Datos extra que tu negocio necesita. Aparecen en {ENTITY_LABEL[entity].where}. Solo las ve tu empresa.
      </p>

      <InlineNotice notice={notice} onDismiss={() => setNotice(null)} />
      {error && error.target === null && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error.message}
        </p>
      )}

      <DataState
        loading={fieldsQ.loading && !fieldsQ.data}
        error={fieldsQ.error}
        onRetry={fieldsQ.reload}
        empty={fields.length === 0}
        emptyMessage={`Aún no tienes columnas propias en ${ENTITY_LABEL[entity].plural.toLowerCase()}. Crea la primera aquí abajo.`}
      >
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {fields.map((f, i) => (
            <CustomFieldRow
              key={f.id}
              field={f}
              entity={entity}
              categories={categories}
              otherLabels={fields.filter((o) => o.id !== f.id).map((o) => o.label)}
              busy={busy}
              error={error?.target === f.id ? error.message : null}
              canUp={i > 0}
              canDown={i < fields.length - 1}
              onMove={(dir) => move(i, dir)}
              onUpdate={(patch, message) => update(f, patch, message)}
              onDelete={() => void remove(f)}
              onCreateCategory={createCategory}
            />
          ))}
        </ul>
      </DataState>

      <ColumnForm
        key={`${entity}-${formKey}`}
        title={`Nueva columna en ${ENTITY_LABEL[entity].plural.toLowerCase()}`}
        initial={blankDraft()}
        entity={entity}
        takenLabels={fields.map((f) => f.label)}
        categories={categories}
        onCreateCategory={createCategory}
        submitLabel="Crear columna"
        busy={busy}
        error={error?.target === "new" ? error.message : null}
        onSubmit={create}
        note={entity === "product" ? "También será una columna en tu inventario y en tu plantilla de Excel." : undefined}
      />
    </div>
  );
}
