"use client";

import { ReactNode, useId } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { formatNumber, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ImportTargetField } from "./parse";
import { ImportFileGaps } from "./ImportFileGaps";
import { ImportGrid } from "./ImportGrid";
import { ImportSummary } from "./ImportSummary";
import type { ImportGridState } from "./useImportGrid";

interface ImportPreviewStepProps {
  grid: ImportGridState;
  targetFields: ImportTargetField[];
  allowNewColumns: boolean;
  mappingExtra?: ReactNode;
  blockReason?: string | null;
  onlyValid: boolean;
  onOnlyValid: (v: boolean) => void;
  importError: string | null;
}

/**
 * Step 2: what the file lacks (once, with its fix), what will happen next to the options, and
 * the editable grid filling the rest of the dialog.
 */
export function ImportPreviewStep({ grid, targetFields, allowNewColumns, mappingExtra, blockReason, onlyValid, onOnlyValid, importError }: ImportPreviewStepProps) {
  const searchId = useId();
  const { invalidCount } = grid;

  const help =
    grid.filter === "errors"
      ? invalidCount === 0
        ? "Ninguna fila tiene errores."
        : `${plural(invalidCount, "fila tiene", "filas tienen")} un dato vacío o que no se entiende. Corrige la celda en rojo o quita la fila con la papelera.`
      : grid.filter === "edited"
        ? "Las celdas que cambiaste se ven en ámbar. «Volver al archivo original» deshace todo."
        : "Toca una celda para corregirla. Enter baja a la siguiente fila y Tab pasa a la siguiente columna.";

  return (
    <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
      <ImportFileGaps grid={grid} />

      <div className={cn("grid gap-3", mappingExtra && "lg:grid-cols-2")}>
        <ImportSummary grid={grid} onlyValid={onlyValid} onOnlyValid={onOnlyValid} blockReason={blockReason} />
        {mappingExtra && <div className="grid content-start gap-3">{mappingExtra}</div>}
      </div>

      {importError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {importError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={grid.filter === "all"} onClick={() => grid.setFilter("all")} count={grid.active.length}>
          Todas
        </Chip>
        <Chip active={grid.filter === "errors"} onClick={() => grid.setFilter("errors")} count={invalidCount}>
          Con errores
        </Chip>
        <Chip active={grid.filter === "edited"} onClick={() => grid.setFilter("edited")} count={grid.rowsEdited.size}>
          Corregidas
        </Chip>
        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {(grid.editedCount > 0 || grid.removedCount > 0) && (
            <button type="button" onClick={grid.restore} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-text-secondary hover:bg-surface-soft hover:text-text-primary">
              <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Volver al archivo original
            </button>
          )}
          <label htmlFor={searchId} className="relative w-full sm:w-auto">
            <span className="sr-only">Buscar en el archivo</span>
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              id={searchId}
              type="search"
              value={grid.query}
              onChange={(e) => grid.setQuery(e.target.value)}
              placeholder="Buscar en el archivo"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent-text focus:outline-none sm:w-56"
            />
          </label>
        </div>
      </div>

      <p aria-live="polite" className={cn("-mt-1 text-[12.5px]", grid.filter === "errors" && invalidCount > 0 ? "text-danger" : "text-text-muted")}>
        {help}
      </p>

      <ImportGrid grid={grid} targetFields={targetFields} allowNewColumns={allowNewColumns} className="max-h-[65dvh] min-h-[280px] lg:max-h-none lg:min-h-[400px] lg:flex-1" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-text-muted">
        <span>
          Mostrando {formatNumber(Math.min(grid.limit, grid.visibleRows.length))} de {plural(grid.visibleRows.length, "fila", "filas")}
        </span>
        {grid.visibleRows.length > grid.limit && (
          <button type="button" onClick={grid.showMore} className="font-semibold text-accent-text hover:underline">
            Mostrar más
          </button>
        )}
      </div>
    </div>
  );
}
