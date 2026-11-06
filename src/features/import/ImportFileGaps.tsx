"use client";

import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { shortDate } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { IGNORE, NEW_COLUMN } from "./parse";
import type { FileGap } from "./types";
import type { ImportGridState } from "./useImportGrid";

/**
 * File problems, said once: a required field that no column of the file has. Each one offers
 * the fix right there — pick the column, type one value for every row, or leave it for later.
 */
export function ImportFileGaps({ grid }: { grid: ImportGridState }) {
  if (grid.fileGaps.length === 0) return null;
  return (
    <div className="space-y-2">
      {grid.fileGaps.map((gap) => (
        <GapRow key={gap.id} gap={gap} grid={grid} />
      ))}
    </div>
  );
}

function GapRow({ gap, grid }: { gap: FileGap; grid: ImportGridState }) {
  const titleId = useId();
  const constantId = useId();
  const [asKey, setAsKey] = useState(gap.keys[0]?.key ?? "");
  const [draft, setDraft] = useState(gap.fill?.mode === "constant" ? gap.fill.raw : "");
  const applied = grid.appliedFills[gap.id];

  const columnOptions: SelectOption[] = grid.headers.map((h, i) => {
    const t = grid.mapping[i]?.target;
    const now = t === IGNORE ? "no se importa" : t === NEW_COLUMN ? "campo propio nuevo" : t ? `ahora es «${grid.fieldLabel(t)}»` : "";
    const sample = grid.samples[i];
    return { value: String(i), label: h, description: [sample && `ej. ${sample.length > 28 ? `${sample.slice(0, 28)}…` : sample}`, now].filter(Boolean).join(" · ") };
  });

  const pickColumn = (value: string) => {
    const key = gap.kind === "group" ? asKey : gap.id;
    grid.setFill(gap.id, null);
    grid.setTarget(Number(value), key);
  };

  const applyConstant = () => grid.setFill(gap.id, draft.trim() ? { mode: "constant", raw: draft } : null);

  // Resolved without a column: say what every row takes, with a way back.
  if (!gap.blocking && applied) {
    const text =
      applied.mode === "later"
        ? (gap.later?.hint ?? "Lo completas después.")
        : `Todas las filas toman ${gap.constant?.type === "date" ? shortDate(`${applied.value}T12:00:00`) : applied.value}.`;
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface px-4 py-3">
        <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-success" />
        <p className="min-w-0 flex-1 text-[13px] text-text-secondary">
          <strong className="font-semibold text-text-primary">«{gap.label}»</strong> no viene en el archivo. {text}
        </p>
        <Button size="sm" variant="ghost" onClick={() => grid.setFill(gap.id, null)}>
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-[13.5px] font-semibold text-text-primary">
            Ninguna columna es «{gap.label}»
          </h3>
          <p className="text-[12.5px] text-text-secondary">
            {gap.kind === "group"
              ? `Lo necesitamos para saber qué producto es cada fila: ${gap.keys.map((k) => k.label.toLowerCase()).join(", ")}.`
              : "Es obligatorio, así que por ahora no se puede importar ninguna fila."}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2.5 pl-0 sm:pl-[26px]">
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-64">
          <span className="text-[12px] font-semibold text-text-secondary">{gap.question}</span>
          <Select aria-label={gap.question} value="" onChange={pickColumn} options={columnOptions} placeholder="Elige la columna" searchable={columnOptions.length > 7} className="bg-surface" />
        </div>
        {gap.kind === "group" && gap.keys.length > 1 && (
          <div className="flex w-full min-w-0 flex-col gap-1 sm:w-48">
            <span className="text-[12px] font-semibold text-text-secondary">Esa columna trae</span>
            <Select aria-label="Qué trae esa columna" value={asKey} onChange={setAsKey} options={gap.keys.map((k) => ({ value: k.key, label: k.label }))} className="bg-surface" />
          </div>
        )}

        {gap.constant && (
          <>
            <span aria-hidden className="text-[12px] text-text-muted sm:pb-3">o</span>
            <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
              <label htmlFor={constantId} className="text-[12px] font-semibold text-text-secondary">
                {gap.constant.label}
              </label>
              <div className="flex gap-2">
                <input
                  id={constantId}
                  type={gap.constant.type === "date" ? "date" : "text"}
                  inputMode={gap.constant.type === "number" ? "decimal" : gap.constant.type === "integer" ? "numeric" : undefined}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyConstant();
                    }
                  }}
                  aria-invalid={!!gap.fillError || undefined}
                  aria-describedby={gap.fillError || gap.constant.hint ? `${constantId}-hint` : undefined}
                  placeholder={gap.constant.type === "number" ? "0.00" : undefined}
                  className={inputClass(gap.fillError, "h-11 min-w-0 flex-1 font-mono sm:w-40 sm:flex-none")}
                />
                <Button variant="secondary" onClick={applyConstant} disabled={!draft.trim()}>
                  Usar
                </Button>
              </div>
            </div>
          </>
        )}

        {gap.later && (
          <>
            <span aria-hidden className="text-[12px] text-text-muted sm:pb-3">o</span>
            <Button variant="ghost" onClick={() => grid.setFill(gap.id, { mode: "later" })} className="h-11">
              {gap.later.label}
            </Button>
          </>
        )}
      </div>

      {(gap.fillError || gap.constant?.hint) && (
        <p id={`${constantId}-hint`} className={cn("mt-2 text-[12px] sm:pl-[26px]", gap.fillError ? "font-semibold text-danger" : "text-text-muted")}>
          {gap.fillError ? `${gap.fillError}: revisa el valor que escribiste.` : gap.constant?.hint}
        </p>
      )}
    </section>
  );
}
