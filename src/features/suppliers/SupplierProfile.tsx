"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { suppliersApi } from "@/services/api/resources";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { changedFields, draftFrom, payloadOf, validateDraft, type SupplierDraft } from "./draft";
import { SaveBar } from "@/components/ui/SaveBar";
import { SupplierCustomFields, SupplierMainFields } from "./SupplierFields";

interface Props {
  companyId: string | null;
  supplier: SupplierDTO;
  fields: CustomFieldDTO[];
  purchases: number;
  onSaved: () => void;
  onDeleted: () => void;
  onManageFields: () => void;
}

/** «Ficha»: every field editable in place, saved together from the sticky bar. */
export function SupplierProfile({ companyId, supplier, fields, purchases, onSaved, onDeleted, onManageFields }: Props) {
  const toast = useToast();
  const [base, setBase] = useState<SupplierDraft>(() => draftFrom(supplier));
  const [draft, setDraft] = useState<SupplierDraft>(base);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const changes = changedFields(base, draft, fields);
  const errors = validateDraft(draft, fields, false);
  const shown = Object.fromEntries(Object.entries(errors).filter(([k]) => submitted || touched.has(k)));
  const patch = (p: Partial<SupplierDraft>) => setDraft((d) => ({ ...d, ...p }));

  const persist = async (next: SupplierDraft) => {
    if (!companyId) throw new Error("Tu sesión se cerró. Vuelve a entrar e inténtalo de nuevo.");
    const saved = await suppliersApi.update(companyId, supplier.id, { ...payloadOf(next), is_active: next.is_active });
    const fresh = draftFrom(saved);
    setBase(fresh);
    setDraft(fresh);
    onSaved();
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const previous = base;
    const count = changes.length;
    setSaving(true);
    setError(null);
    try {
      await persist(draft);
      setTouched(new Set());
      setSubmitted(false);
      toast(`Guardaste ${count} ${count === 1 ? "cambio" : "cambios"} en «${draft.business_name.trim()}».`, {
        undo: () => {
          persist(previous).catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudo deshacer."));
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(base);
    setTouched(new Set());
    setSubmitted(false);
    setError(null);
  };

  const problems = Object.values(shown);

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <section aria-labelledby="profile-main" className="space-y-4 rounded-2xl border border-border bg-surface p-6">
        <h2 id="profile-main" className="text-[15px] font-semibold text-text-primary">
          Datos del proveedor
        </h2>
        <SupplierMainFields draft={draft} onChange={patch} errors={shown} rucEditable={false} onBlur={(f) => setTouched((t) => new Set(t).add(f))} />
        <div className="flex items-center gap-3 rounded-xl bg-surface-soft px-4 py-3">
          <Switch checked={draft.is_active} onChange={(is_active) => patch({ is_active })} label="Proveedor activo" />
          <span className="text-sm">
            <span className="block font-semibold text-text-primary">{draft.is_active ? "Activo" : "Inactivo"}</span>
            <span className="block text-[12.5px] text-text-muted">Los inactivos no aparecen al registrar compras. Su historial se mantiene.</span>
          </span>
        </div>
      </section>

      <section aria-labelledby="profile-custom" className="space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="profile-custom" className="text-[15px] font-semibold text-text-primary">
            Campos propios
          </h2>
          <button type="button" onClick={onManageFields} className="text-[13px] font-semibold text-accent-text hover:underline">
            Administrar campos
          </button>
        </div>
        {fields.length > 0 ? (
          <SupplierCustomFields fields={fields} values={draft.custom} errors={shown} onChange={(key, value) => patch({ custom: { ...draft.custom, [key]: value } })} />
        ) : (
          <p className="text-sm text-text-secondary">Agrega los datos que tú necesitas de tus proveedores, como el banco o el N.º de cuenta.</p>
        )}
      </section>

      <section aria-labelledby="profile-danger" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="profile-danger" className="text-[15px] font-semibold text-text-primary">
            Eliminar proveedor
          </h2>
          <p className="text-[13px] text-text-muted">Borra la ficha. Sus compras se quedan en tu historial.</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
          Eliminar
        </Button>
      </section>

      {changes.length > 0 && (
        <SaveBar
          message={problems.length > 0 ? `Revisa: ${problems.join(" ")}` : `${changes.length} ${changes.length === 1 ? "cambio" : "cambios"} sin guardar: ${changes.join(", ")}`}
          saving={saving}
          onDiscard={discard}
          onSave={save}
        />
      )}

      <DeleteSupplierDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        companyId={companyId}
        supplier={supplier}
        purchases={purchases}
        onDeleted={onDeleted}
      />
    </div>
  );
}
