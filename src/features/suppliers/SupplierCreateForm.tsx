"use client";

import { useState } from "react";
import { suppliersApi } from "@/services/api/resources";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { EMPTY_DRAFT, payloadOf, validateDraft, type SupplierDraft } from "./draft";
import { SupplierCustomFields, SupplierMainFields } from "./SupplierFields";

interface Props {
  formId: string;
  companyId: string | null;
  fields: CustomFieldDTO[];
  onSavingChange: (saving: boolean) => void;
  onCreated: (saved: SupplierDTO) => void;
}

/** Body of «Nuevo proveedor». Mounted only while the modal is open, so it starts empty each time. */
export function SupplierCreateForm({ formId, companyId, fields, onSavingChange, onCreated }: Props) {
  const [draft, setDraft] = useState<SupplierDraft>(EMPTY_DRAFT);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = validateDraft(draft, fields, true);
  const shown = Object.fromEntries(Object.entries(all).filter(([k]) => submitted || touched.has(k)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!companyId || Object.keys(all).length > 0) return;
    onSavingChange(true);
    setError(null);
    try {
      const saved = await suppliersApi.create(companyId, { ruc: draft.ruc, ...payloadOf(draft) });
      onCreated(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el proveedor.");
    } finally {
      onSavingChange(false);
    }
  };

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <SupplierMainFields
        draft={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        errors={shown}
        rucEditable
        onBlur={(field) => setTouched((t) => new Set(t).add(field))}
      />
      {fields.length > 0 && (
        <fieldset className="space-y-3 rounded-2xl bg-surface-soft p-4">
          <legend className="sr-only">Campos propios</legend>
          <p className="text-[13px] font-semibold text-text-primary">Campos propios</p>
          <SupplierCustomFields
            fields={fields}
            values={draft.custom}
            errors={shown}
            onChange={(key, value) => setDraft((d) => ({ ...d, custom: { ...d.custom, [key]: value } }))}
          />
        </fieldset>
      )}
    </form>
  );
}
