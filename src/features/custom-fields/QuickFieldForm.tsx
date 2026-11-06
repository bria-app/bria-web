"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { ColumnForm } from "./ColumnForm";
import { blankDraft, parseOptions, toRules, type ColumnDraft } from "./columnDraft";

interface QuickFieldFormProps {
  companyId: string;
  /** Labels already in use, to stop duplicates before asking the API. */
  takenLabels: string[];
  /** The product's category, offered as the column's scope. */
  category?: { id: string; name: string } | null;
  onCreated: (field: CustomFieldDTO) => void;
  onCancel: () => void;
}

/**
 * A new product column created without leaving the product, with the same editor as
 * everywhere else. It becomes an inventory column and an Excel column too.
 */
export function QuickFieldForm({ companyId, takenLabels, category, onCreated, onCancel }: QuickFieldFormProps) {
  const [onlyCategory, setOnlyCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const create = async (d: ColumnDraft) => {
    setApiError(null);
    setSaving(true);
    try {
      const field = await customFieldsApi.create(companyId, {
        entity: "product",
        label: d.label.trim(),
        field_type: d.field_type,
        options: d.field_type === "select" ? parseOptions(d.options) : [],
        is_required: d.is_required,
        category_ids: onlyCategory && category ? [category.id] : [],
        rules: toRules(d, true),
      });
      onCreated(field);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo crear la columna.");
      setSaving(false);
    }
  };

  return (
    // Nested: it lives inside the product form, and nested forms are invalid HTML.
    <ColumnForm
      nested
      className="pop-in bg-surface-soft"
      initial={blankDraft()}
      entity="product"
      takenLabels={takenLabels}
      submitLabel="Agregar columna"
      busy={saving}
      error={apiError}
      autoFocus
      onSubmit={create}
      onCancel={onCancel}
      note="También será una columna en tu inventario y en tu Excel."
      extra={category ? <Switch showLabel label={`Solo para «${category.name}»`} checked={onlyCategory} onChange={setOnlyCategory} /> : undefined}
    />
  );
}
