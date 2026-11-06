"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CustomFieldDTO, CustomFieldEntity } from "@/types/custom-fields";
import { CustomFieldsManager } from "./CustomFieldsManager";
import { isStorableEntity } from "./entities";

export interface BuiltinColumn {
  key: string;
  label: string;
  /** Always shown (e.g. the name). */
  locked?: boolean;
}

interface ColumnsManagerProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  entity: CustomFieldEntity;
  /** e.g. «proveedores» — used in copy. */
  entityLabel: string;
  builtinColumns: BuiltinColumn[];
  hiddenBuiltins: string[];
  onHiddenBuiltinsChange: (next: string[]) => void;
  fields: CustomFieldDTO[];
  onFieldsChanged: () => void;
}

type Tab = "columns" | "fields";

/**
 * «Columnas» for list screens that keep their own table (suppliers): which columns show,
 * plus the custom-fields manager. The inventory table uses its own side panel instead.
 */
export function ColumnsManager({
  open,
  onClose,
  companyId,
  entity,
  entityLabel,
  builtinColumns,
  hiddenBuiltins,
  onHiddenBuiltinsChange,
  fields,
  onFieldsChanged,
}: ColumnsManagerProps) {
  const [tab, setTab] = useState<Tab>("columns");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleBuiltin = (key: string) =>
    onHiddenBuiltinsChange(hiddenBuiltins.includes(key) ? hiddenBuiltins.filter((k) => k !== key) : [...hiddenBuiltins, key]);

  const toggleField = async (f: CustomFieldDTO) => {
    if (!companyId) return;
    setBusyId(f.id);
    setError(null);
    try {
      await customFieldsApi.update(companyId, f.id, { is_visible: !f.is_visible });
      onFieldsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la columna.");
    } finally {
      setBusyId(null);
    }
  };

  const row = (key: string, label: string, sub: string, control: React.ReactNode) => (
    <li key={key} className="flex min-h-[52px] items-center gap-3 px-4">
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm text-text-primary">{label}</span>
        <span className="text-[12px] text-text-muted">{sub}</span>
      </span>
      {control}
    </li>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Columnas"
      description={`Elige qué ves en la tabla de ${entityLabel}. Se guarda para todo tu equipo.`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "columns", label: "Columnas de la tabla" },
          ...(isStorableEntity(entity) ? [{ id: "fields", label: "Tus columnas", count: fields.length }] : []),
        ]}
      />
      {tab === "columns" && (
        <div className="space-y-3">
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {builtinColumns.map((c) =>
              row(
                c.key,
                c.label,
                c.locked ? "Fija · siempre visible" : "Del sistema",
                c.locked ? (
                  <Lock aria-label="Columna fija" className="h-4 w-4 text-text-muted" />
                ) : (
                  <Switch label={`Mostrar «${c.label}»`} checked={!hiddenBuiltins.includes(c.key)} onChange={() => toggleBuiltin(c.key)} />
                ),
              ),
            )}
            {fields.map((f) =>
              row(f.id, f.label, "Tuya", <Switch label={`Mostrar «${f.label}»`} checked={f.is_visible} disabled={busyId === f.id} onChange={() => void toggleField(f)} />),
            )}
          </ul>
        </div>
      )}
      {tab === "fields" && isStorableEntity(entity) && (
        <CustomFieldsManager companyId={companyId} initialEntity={entity} onChanged={(e) => e === entity && onFieldsChanged()} />
      )}
    </Modal>
  );
}
