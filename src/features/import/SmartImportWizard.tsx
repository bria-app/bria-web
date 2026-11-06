"use client";

import { ReactNode, useId, useState } from "react";
import { AlertTriangle, Check, FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatNumber, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ImportRequirementGroup, ImportTargetField } from "./parse";
import { useImportGrid } from "./useImportGrid";
import { ImportUploadStep } from "./ImportUploadStep";
import { ImportPreviewStep } from "./ImportPreviewStep";
import { ImportDoneStep } from "./ImportDoneStep";
import type { AppliedFills, ImportResult, ImportRow, NewCustomColumn } from "./types";

export type { ImportRequirementGroup, ImportTargetField } from "./parse";
export type { AppliedFills, ImportResult, ImportRow, NewCustomColumn } from "./types";

interface SmartImportWizardProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Plural noun for what is being imported («productos», «compras»). */
  entityLabel: string;
  /**
   * Fields the file can feed. Existing custom columns go here too with key
   * `custom:<field key>` so they can be matched like any other field.
   */
  targetFields: ImportTargetField[];
  /** Unmatched headers can become new custom fields (created by the caller). */
  allowNewColumns?: boolean;
  /** At least one field of each group must come from a column (código, código de barras o nombre). */
  requireOneOf?: ImportRequirementGroup[];
  /** Extra controls on the review step (e.g. the supplier of a purchase import). */
  mappingExtra?: ReactNode;
  /** Blocks the import button with this message (e.g. «Elige el proveedor»). */
  blockReason?: string | null;
  /** Shown on the upload step: what the file should look like. */
  uploadHint?: ReactNode;
  /** `fills` says which required fields took one typed value or were left for later. */
  onImport: (rows: ImportRow[], newColumns: NewCustomColumn[], fills: AppliedFills) => Promise<ImportResult>;
  onFinished?: () => void;
}

type Step = "upload" | "preview" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Elige tu archivo" },
  { id: "preview", label: "Revisa las columnas" },
  { id: "done", label: "Resultado" },
];

/**
 * Spreadsheet import: read any Excel/CSV in the browser, map its columns, fix cells and drop
 * rows on an editable preview, then send the rows. Nothing is saved before «Importar».
 */
export function SmartImportWizard({
  open,
  onClose,
  title,
  entityLabel,
  targetFields,
  allowNewColumns = true,
  requireOneOf,
  mappingExtra,
  blockReason,
  uploadHint,
  onImport,
  onFinished,
}: SmartImportWizardProps) {
  const grid = useImportGrid(targetFields, allowNewColumns, requireOneOf);
  const reasonId = useId();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [onlyValid, setOnlyValid] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    grid.clear();
    setStep("upload");
    setFile(null);
    setReadError(null);
    setImportError(null);
    setResult(null);
  };

  const close = () => {
    if (importing) return;
    if (step === "done") onFinished?.();
    reset();
    onClose();
  };

  const handleFile = async (f: File) => {
    setReading(true);
    setReadError(null);
    try {
      // The reader (and the Excel library behind it) loads only when a file is picked.
      const { readSpreadsheet } = await import("./parse");
      const parsed = await readSpreadsheet(f);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setReadError("No encontramos filas con datos en el archivo.");
        return;
      }
      setFile(f);
      grid.load(parsed);
      setStep("preview");
    } catch {
      setReadError("No pudimos leer el archivo. Usa un Excel (.xlsx o .xls) o un .csv.");
    } finally {
      setReading(false);
    }
  };

  const importCount = onlyValid ? grid.validCount : grid.active.length;
  // Why «Importar» is off, said next to it: the file first, then the caller's own rule, then rows.
  const gaps = grid.blockingGaps;
  const reason =
    gaps.length > 0
      ? gaps.length === 1
        ? `Falta elegir la columna «${gaps[0].label}»`
        : `Faltan ${gaps.length} columnas: ${gaps.map((g) => `«${g.label}»`).join(" y ")}`
      : blockReason
        ? blockReason
        : importCount > 0
          ? null
          : grid.active.length === 0
            ? "Quitaste todas las filas"
            : "Ninguna fila está lista: corrige las celdas en rojo";

  const runImport = async () => {
    const rows = grid.active.filter((b) => !onlyValid || b.errors.length === 0).map((b) => b.row);
    if (rows.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      setResult(await onImport(rows, grid.newColumns, grid.appliedFills));
      setStep("done");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "No se pudo terminar la importación. Inténtalo de nuevo.");
    } finally {
      setImporting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size={step === "preview" ? "wide" : "xl"}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <span className="hidden min-w-0 truncate text-[12.5px] text-text-muted md:block">
            {file && step !== "upload" && (
              <span className="inline-flex items-center gap-1.5">
                <FileSpreadsheet aria-hidden className="h-3.5 w-3.5" /> {file.name} · {plural(grid.sheet?.rows.length ?? 0, "fila", "filas")}
                {grid.sheet?.sheetName && ` · hoja ${grid.sheet.sheetName}`}
              </span>
            )}
          </span>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            {step === "upload" && (
              <Button variant="ghost" onClick={close}>
                Cancelar
              </Button>
            )}
            {step === "preview" && (
              <>
                {reason && (
                  <p id={reasonId} className="flex min-w-0 basis-full items-center justify-end gap-1.5 text-right text-[13px] font-semibold text-warning sm:basis-auto">
                    <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">{reason}</span>
                  </p>
                )}
                <Button variant="ghost" onClick={reset} disabled={importing}>
                  Cambiar archivo
                </Button>
                <Button variant="strong" onClick={runImport} loading={importing} disabled={!!reason} aria-describedby={reason ? reasonId : undefined}>
                  Importar {formatNumber(importCount)} {importCount === 1 ? "fila" : "filas"}
                </Button>
              </>
            )}
            {step === "done" && (
              <Button variant="strong" onClick={close}>
                Listo
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className={cn("flex flex-col", step === "preview" && "lg:h-full")}>
        <ol className="mb-4 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2" aria-label="Pasos">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === stepIndex ? "step" : undefined} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full font-mono text-xs font-semibold",
                  i < stepIndex ? "bg-strong text-strong-foreground" : i === stepIndex ? "bg-primary text-on-primary" : "bg-surface-muted text-text-muted",
                )}
              >
                {i < stepIndex ? <Check aria-hidden className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-sm font-semibold", i === stepIndex ? "text-text-primary" : "text-text-muted")}>{s.label}</span>
              {i < STEPS.length - 1 && <span aria-hidden className="hidden h-px w-8 bg-border sm:block" />}
            </li>
          ))}
        </ol>

        {step === "upload" && <ImportUploadStep reading={reading} error={readError} hint={uploadHint} onFile={handleFile} />}
        {step === "preview" && grid.sheet && (
          <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <ImportPreviewStep
              grid={grid}
              targetFields={targetFields}
              allowNewColumns={allowNewColumns}
              mappingExtra={mappingExtra}
              blockReason={blockReason}
              onlyValid={onlyValid}
              onOnlyValid={setOnlyValid}
              importError={importError}
            />
          </div>
        )}
        {step === "done" && result && <ImportDoneStep result={result} entityLabel={entityLabel} />}
      </div>
    </Modal>
  );
}
