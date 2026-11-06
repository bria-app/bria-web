"use client";

import { useId } from "react";
import { ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { formatNumber, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ImportGridState } from "./useImportGrid";

interface ImportSummaryProps {
  grid: ImportGridState;
  onlyValid: boolean;
  onOnlyValid: (v: boolean) => void;
  /** The importer's own blocker (e.g. «Elige el proveedor»), said after the file's. */
  blockReason?: string | null;
  className?: string;
}

const MAX_GROUPS = 4;

/** «Qué va a pasar»: rows ready, rows with errors and what happens to them, and why. */
export function ImportSummary({ grid, onlyValid, onOnlyValid, blockReason, className }: ImportSummaryProps) {
  const { validCount, invalidCount, removedCount, errorGroups, blockingGaps } = grid;
  const total = grid.active.length;
  const titleId = useId();

  let outcome: string;
  if (blockingGaps.length > 0) outcome = `Primero elige qué columna es ${blockingGaps.map((g) => `«${g.label}»`).join(" y ")}.`;
  else if (blockReason) outcome = `${blockReason.replace(/\.$/, "")}.`;
  else if (total === 0) outcome = "Quitaste todas las filas.";
  else if (invalidCount === 0) outcome = `Todo se ve bien: se importan ${total === 1 ? "la fila" : `las ${formatNumber(total)} filas`}.`;
  else if (onlyValid)
    outcome =
      validCount === 0
        ? "Ninguna fila está lista: corrige las celdas en rojo."
        : `Se importan ${plural(validCount, "fila lista", "filas listas")}; ${invalidCount === 1 ? "la que tiene errores se salta" : `las ${formatNumber(invalidCount)} con errores se saltan`}.`;
  else outcome = `Se intentan las ${formatNumber(total)} filas; las que tienen errores van sin el dato malo y pueden no importarse.`;

  return (
    <section aria-labelledby={titleId} className={cn("@container flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={titleId} className="text-sm font-semibold text-text-primary">
          Qué va a pasar
        </h3>
        {grid.newColumns.length > 0 && (
          <span className="text-[12.5px] text-text-secondary">
            {grid.newColumns.length === 1 ? "Se crea 1 campo propio" : `Se crean ${grid.newColumns.length} campos propios`}
          </span>
        )}
      </div>

      <div className="grid gap-3 @3xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] @3xl:items-start @3xl:gap-5">
        <dl className="grid grid-cols-3 gap-2">
          <Stat label={validCount === 1 ? "lista" : "listas"} value={validCount} tone="success" />
          <Stat label="con errores" value={invalidCount} tone={invalidCount > 0 ? "danger" : "muted"} />
          <Stat label={removedCount === 1 ? "quitada" : "quitadas"} value={removedCount} tone="muted" />
        </dl>

        <div className="flex min-w-0 flex-col gap-3">
          <p aria-live="polite" className={cn("text-[13px]", blockingGaps.length > 0 || blockReason ? "font-semibold text-warning" : "text-text-secondary")}>
            {outcome}
          </p>

          {invalidCount > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 @3xl:border-t-0 @3xl:pt-0">
              <Switch showLabel label="Saltar las filas con errores" checked={onlyValid} onChange={onOnlyValid} />
              <ul className="flex flex-wrap gap-1.5" aria-label="Qué está mal">
                {errorGroups.slice(0, MAX_GROUPS).map((g) => (
                  <li key={`${g.c}:${g.short}`}>
                    <button
                      type="button"
                      onClick={() => grid.jumpTo(g.first, g.c)}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1 text-left text-[12px] text-text-secondary hover:border-danger hover:text-text-primary"
                    >
                      <span className="font-semibold text-text-primary">{g.label}</span>
                      <span className="text-danger">{g.short.toLowerCase()}</span>
                      <span className="font-mono text-text-muted">· {plural(g.count, "fila", "filas")}</span>
                      <ArrowRight aria-hidden className="h-3 w-3 shrink-0" />
                    </button>
                  </li>
                ))}
                {errorGroups.length > MAX_GROUPS && (
                  <li>
                    <button type="button" onClick={() => grid.setFilter("errors")} className="inline-flex min-h-8 items-center px-1 text-[12px] font-semibold text-accent-text hover:underline">
                      Ver todas
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "danger" | "muted" }) {
  return (
    <div className="rounded-xl bg-surface-soft px-3 py-2">
      <dt className="sr-only">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn("font-display text-xl font-bold tabular-nums", tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-text-muted")}>
          {formatNumber(value)}
        </span>
        <span aria-hidden className="text-[12.5px] text-text-secondary">
          {label}
        </span>
      </dd>
    </div>
  );
}
