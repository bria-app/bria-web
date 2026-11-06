import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { ImportResult } from "./types";

/** Step 3: what the server actually did, including the rows it rejected. */
export function ImportDoneStep({ result, entityLabel }: { result: ImportResult; entityLabel: string }) {
  const nothing = result.created === 0 && !result.updated;
  // Only what happened («Se actualizaron 5», not «Se crearon 0 · se actualizaron 5»), in singular when it is one.
  const parts = (
    [
      [result.created, "se creó", "se crearon"],
      [result.updated ?? 0, "se actualizó", "se actualizaron"],
      [result.skipped ?? 0, "se saltó", "se saltaron"],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([n, one, many], i) => (n === 1 ? `${one} 1` : `${many} ${formatNumber(n)}${i === 0 ? ` ${entityLabel}` : ""}`));
  const line = parts.join(" · ");
  const summary = line
    ? line.charAt(0).toUpperCase() + line.slice(1)
    : result.errors.length
      ? "Revisa las filas de abajo, corrígelas en tu archivo y vuelve a importarlo."
      : `Tu archivo no traía ${entityLabel} para cargar.`;

  return (
    <div className="space-y-5 py-2">
      <div className="flex flex-col items-center gap-2 text-center">
        {nothing ? <AlertTriangle aria-hidden className="h-9 w-9 text-warning" /> : <CheckCircle2 aria-hidden className="h-9 w-9 text-success" />}
        <p className="font-display text-xl font-bold text-text-primary">{nothing ? "No se cargó ninguna fila" : "Listo, ya está en bria"}</p>
        <p className="text-sm text-text-secondary">{summary}</p>
      </div>
      {result.notes?.map((n) => (
        <p key={n} className="text-center text-sm text-text-secondary">
          {n}
        </p>
      ))}
      {result.errors.length > 0 && (
        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-sm font-semibold text-danger">
            {result.errors.length === 1 ? "1 fila no se pudo cargar" : `${formatNumber(result.errors.length)} filas no se pudieron cargar`}
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-[13px] text-text-secondary">
            {result.errors.map((e, i) => (
              <li key={i}>
                <span className="font-mono">Fila {e.row}</span>: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
