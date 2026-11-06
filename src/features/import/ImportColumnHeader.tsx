"use client";

import { useState } from "react";
import { EyeOff, Plus } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { IGNORE, NEW_COLUMN, type ImportTargetField, type MappingSuggestion } from "./parse";
import { cn } from "@/lib/utils";
import type { NewCustomColumn } from "./types";

const NEW_TYPE_OPTIONS: SelectOption<NewCustomColumn["field_type"]>[] = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
];

const CONFIDENCE: Record<NonNullable<MappingSuggestion["confidence"]>, { label: string; tone: "success" | "neutral" | "warning" }> = {
  alta: { label: "Reconocida", tone: "success" },
  media: { label: "Probable", tone: "neutral" },
  baja: { label: "Revísala", tone: "warning" },
};

interface ImportColumnHeaderProps {
  index: number;
  header: string;
  mapping: MappingSuggestion[];
  targetFields: ImportTargetField[];
  allowNewColumns: boolean;
  newLabel: string;
  newType: NewCustomColumn["field_type"];
  /** Rows whose value in this column has a problem. */
  problemCount: number;
  onTarget: (target: string) => void;
  onNewLabel: (label: string) => void;
  onNewType: (type: NewCustomColumn["field_type"]) => void;
}

/** «Esta columna es…»: the file's header, what we matched it to, and new-field options. */
export function ImportColumnHeader({ index, header, mapping, targetFields, allowNewColumns, newLabel, newType, problemCount, onTarget, onNewLabel, onNewType }: ImportColumnHeaderProps) {
  const [renaming, setRenaming] = useState(false);
  const m = mapping[index];
  const ignored = m?.target === IGNORE;
  const isNew = m?.target === NEW_COLUMN;
  const taken = new Set(mapping.filter((_, j) => j !== index).map((x) => x.target));

  const options: SelectOption[] = [
    ...targetFields
      .filter((t) => !t.key.startsWith("custom:"))
      .map((t) => ({ value: t.key, label: t.required ? `${t.label} (obligatorio)` : t.label, description: t.hint, group: "Datos de bria", disabled: taken.has(t.key) })),
    ...targetFields
      .filter((t) => t.key.startsWith("custom:"))
      .map((t) => ({ value: t.key, label: t.label, group: "Tus campos propios", disabled: taken.has(t.key) })),
    ...(allowNewColumns ? [{ value: NEW_COLUMN, label: "Crear como campo propio", group: "Otras opciones", icon: <Plus aria-hidden className="h-3.5 w-3.5" /> }] : []),
    { value: IGNORE, label: "No importar esta columna", group: "Otras opciones", icon: <EyeOff aria-hidden className="h-3.5 w-3.5" /> },
  ];

  return (
    <th scope="col" className={cn("min-w-[210px] border-b border-r border-border bg-surface-soft px-2.5 py-2 align-top font-normal last:border-r-0", ignored && "bg-surface-muted")}>
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
        <span className={cn("truncate font-mono text-[12px] text-text-muted", ignored && "line-through")} title={header}>
          «{header}»
        </span>
        {m?.confidence && !ignored && <Badge tone={CONFIDENCE[m.confidence].tone} className="px-2 py-0 text-[10.5px]">{CONFIDENCE[m.confidence].label}</Badge>}
      </div>
      <Select size="sm" aria-label={`Qué es la columna ${header}`} value={m?.target ?? IGNORE} options={options} searchable onChange={onTarget} />
      {isNew && (
        <div className="mt-1.5 grid grid-cols-[1fr_92px] gap-1.5">
          {renaming ? (
            <input
              autoFocus
              aria-label="Nombre del campo nuevo"
              value={newLabel}
              onChange={(e) => onNewLabel(e.target.value)}
              onBlur={() => setRenaming(false)}
              onKeyDown={(e) => e.key === "Enter" && setRenaming(false)}
              className="h-8 min-w-0 rounded-lg border border-border bg-surface px-2 text-xs text-text-primary focus:border-accent-text focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label={`Cambiar el nombre del campo nuevo (${newLabel || "sin nombre"})`}
              className="flex h-8 min-w-0 items-center rounded-lg border border-border bg-surface px-2 text-left text-xs font-semibold text-accent-text hover:border-text-muted/50"
            >
              <span className="truncate">{newLabel || "Sin nombre"}</span>
            </button>
          )}
          <Select<NewCustomColumn["field_type"]> size="sm" aria-label="Tipo del campo nuevo" value={newType} options={NEW_TYPE_OPTIONS} onChange={onNewType} />
        </div>
      )}
      {problemCount > 0 && !ignored && (
        <p className="mt-1.5 text-[11.5px] font-semibold text-danger">{problemCount === 1 ? "1 fila con error" : `${problemCount} filas con error`}</p>
      )}
    </th>
  );
}
