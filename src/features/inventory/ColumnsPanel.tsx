"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, X } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import type { CatalogColumn } from "./catalogColumns";
import type { ColumnSetting } from "./useCatalogColumns";

interface ColumnsPanelProps {
  fixed: CatalogColumn[];
  settings: ColumnSetting[];
  onToggle: (column: CatalogColumn) => Promise<void>;
  onMove: (key: string, dir: -1 | 1) => void;
  onReset: () => void;
  onManageFields: () => void;
  onClose: () => void;
  error: string | null;
}

const ORIGIN: Record<CatalogColumn["origin"], { label: string; className: string }> = {
  fija: { label: "Fija", className: "text-text-muted" },
  sistema: { label: "Del sistema", className: "text-text-muted" },
  propio: { label: "Campo propio", className: "text-accent-text" },
};

/** «Columnas»: show, hide and order the table's columns. Saved for the whole team. */
export function ColumnsPanel({ fixed, settings, onToggle, onMove, onReset, onManageFields, onClose, error }: ColumnsPanelProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const shown = settings.filter((s) => s.visible);
  const hidden = settings.filter((s) => !s.visible);

  const flip = async (column: CatalogColumn) => {
    setBusyKey(column.key);
    setToggleError(null);
    try {
      await onToggle(column);
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "No se pudo cambiar la columna.");
    } finally {
      setBusyKey(null);
    }
  };

  const row = (s: ColumnSetting) => (
    <li key={s.column.key} className={cn("flex min-h-11 items-center gap-2 rounded-xl px-2", !s.visible && "bg-surface-soft")}>
      {s.visible ? (
        <span className="flex flex-col">
          <button type="button" disabled={!s.canUp} onClick={() => onMove(s.column.key, -1)} aria-label={`Mover «${s.column.label}» a la izquierda`} className="grid h-5 w-7 place-items-center rounded text-text-muted hover:text-text-primary disabled:opacity-30">
            <ChevronUp aria-hidden className="h-3.5 w-3.5" />
          </button>
          <button type="button" disabled={!s.canDown} onClick={() => onMove(s.column.key, 1)} aria-label={`Mover «${s.column.label}» a la derecha`} className="grid h-5 w-7 place-items-center rounded text-text-muted hover:text-text-primary disabled:opacity-30">
            <ChevronDown aria-hidden className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <span className="w-7" />
      )}
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[13.5px] text-text-primary">{s.column.label}</span>
        <span className={cn("text-[11.5px]", ORIGIN[s.column.origin].className)}>{ORIGIN[s.column.origin].label}</span>
      </span>
      <Switch checked={s.visible} onChange={() => void flip(s.column)} label={`Mostrar «${s.column.label}»`} disabled={busyKey === s.column.key} />
    </li>
  );

  return (
    <aside aria-label="Columnas" className="w-full shrink-0 rounded-2xl border border-border bg-surface p-4 shadow-soft-lg lg:sticky lg:top-24 lg:w-[300px]">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Columnas</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar columnas" className="grid h-9 w-9 place-items-center rounded-xl text-text-muted hover:bg-surface-soft hover:text-text-primary">
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 text-[12.5px] text-text-muted">Se guarda para todo tu equipo. Las fijas no se mueven.</p>
      {(error || toggleError) && (
        <p role="alert" className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
          {toggleError ?? error}
        </p>
      )}
      <ul className="space-y-0.5">
        {fixed.map((c) => (
          <li key={c.key} className="flex min-h-11 items-center gap-2 px-2">
            <span className="grid w-7 place-items-center text-text-muted">
              <Lock aria-hidden className="h-3.5 w-3.5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13.5px] text-text-primary">{c.label}</span>
              <span className="text-[11.5px] text-text-muted">Fija · siempre visible</span>
            </span>
          </li>
        ))}
        {shown.map(row)}
      </ul>
      {hidden.length > 0 && (
        <>
          <p className="mb-1 mt-4 px-2 text-[12px] font-semibold text-text-muted">Ocultas</p>
          <ul className="space-y-0.5">{hidden.map(row)}</ul>
        </>
      )}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-[13px] font-semibold">
        <button type="button" onClick={onManageFields} className="text-accent-text hover:underline">
          Administrar campos propios
        </button>
        <button type="button" onClick={onReset} className="text-text-muted hover:text-text-primary">
          Restablecer
        </button>
      </div>
    </aside>
  );
}
