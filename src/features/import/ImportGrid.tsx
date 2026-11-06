"use client";

import { useEffect, useMemo, useRef } from "react";
import { Trash2 } from "lucide-react";
import { IGNORE, type ImportTargetField } from "./parse";
import { cn } from "@/lib/utils";
import { ImportColumnHeader } from "./ImportColumnHeader";
import { RowIssues } from "./RowIssues";
import type { ImportGridState } from "./useImportGrid";

interface ImportGridProps {
  grid: ImportGridState;
  targetFields: ImportTargetField[];
  allowNewColumns: boolean;
  className?: string;
}

/** The file as a spreadsheet: pick what each column is, fix cells in place, drop rows. */
export function ImportGrid({ grid, targetFields, allowNewColumns, className }: ImportGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { headers, mapping, editing, errorGroups } = grid;
  const problemsByColumn = useMemo(() => {
    const out = new Map<number, number>();
    for (const g of errorGroups) out.set(g.c, (out.get(g.c) ?? 0) + g.count);
    return out;
  }, [errorGroups]);

  useEffect(() => {
    if (!editing) return;
    ref.current?.querySelector<HTMLElement>(`[data-cell="${editing.r}:${editing.c}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [editing]);

  return (
    <div ref={ref} className={cn("relative overflow-auto rounded-2xl border border-border bg-surface", className)}>
      <table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-10">
          <tr>
            <th scope="col" className="sticky left-0 z-20 w-[92px] min-w-[92px] border-b border-r border-border bg-surface-soft px-2.5 py-2 align-bottom text-[11px] font-semibold text-text-muted">
              Fila
            </th>
            {headers.map((header, i) => {
              const col = grid.newColumns[grid.newColumnIdx.indexOf(i)];
              return (
                <ImportColumnHeader
                  key={i}
                  index={i}
                  header={header}
                  mapping={mapping}
                  targetFields={targetFields}
                  allowNewColumns={allowNewColumns}
                  newLabel={grid.newLabels[i] ?? header}
                  newType={grid.newTypes[i] ?? col?.field_type ?? "text"}
                  problemCount={problemsByColumn.get(i) ?? 0}
                  onTarget={(t) => grid.setTarget(i, t)}
                  onNewLabel={(l) => grid.setNewLabel(i, l)}
                  onNewType={(t) => grid.setNewType(i, t)}
                />
              );
            })}
          </tr>
        </thead>
        <tbody>
          {grid.visibleRows.slice(0, grid.limit).map((b) => {
            const hasErr = b.errors.length > 0;
            const firstBad = b.cells.findIndex((c) => c?.bad);
            return (
              <tr key={b.index} className="group">
                <td className={cn("sticky left-0 z-[5] border-b border-r border-border px-2 py-1.5 align-top", hasErr ? "bg-danger-soft" : "bg-surface")}>
                  <span className="flex items-center gap-1.5">
                    <span className={cn("min-w-[2ch] font-mono text-[11.5px]", hasErr ? "font-semibold text-danger" : "text-text-muted")}>{b.row.rowNumber}</span>
                    {hasErr && <RowIssues rowNumber={b.row.rowNumber} errors={b.errors} onFix={() => firstBad >= 0 && grid.jumpTo(b.index, firstBad)} />}
                    <button
                      type="button"
                      onClick={() => grid.removeRow(b.index)}
                      className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded text-text-muted opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                      aria-label={`Quitar la fila ${b.row.rowNumber}`}
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </td>
                {headers.map((_, c) => {
                  const cell = b.cells[c];
                  const ignored = mapping[c]?.target === IGNORE;
                  const isEditing = editing?.r === b.index && editing.c === c;
                  const wasEdited = grid.edited.has(`${b.index}:${c}`);
                  return (
                    <td
                      key={c}
                      data-cell={`${b.index}:${c}`}
                      onClick={() => !isEditing && grid.startEdit(b.index, c)}
                      title={cell?.bad ? (cell.msg ?? cell.short) : undefined}
                      className={cn(
                        "relative whitespace-nowrap border-b border-r border-border px-2.5 py-1.5 align-top last:border-r-0",
                        ignored ? "cursor-default bg-surface-soft text-text-muted" : "cursor-text hover:bg-surface-soft",
                        cell?.bad && "bg-danger-soft text-danger shadow-[inset_2px_0_0_rgb(var(--c-danger))] hover:bg-danger-soft",
                        wasEdited && !cell?.bad && "bg-primary-soft",
                        isEditing && "p-0",
                      )}
                    >
                      {isEditing && cell?.bad && (
                        // Only one cell is edited at a time, so one id is enough.
                        <span id="import-cell-problem" className="sr-only">
                          {cell.msg ?? cell.short}
                        </span>
                      )}
                      {isEditing ? (
                        <input
                          autoFocus
                          aria-label={`Fila ${b.row.rowNumber}, ${headers[c]}`}
                          aria-invalid={cell?.bad || undefined}
                          aria-describedby={cell?.bad ? "import-cell-problem" : undefined}
                          value={grid.draft}
                          onChange={(e) => grid.setDraft(e.target.value)}
                          onBlur={() => grid.commit()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              grid.commit("down");
                            } else if (e.key === "Tab") {
                              e.preventDefault();
                              grid.commit("right");
                            } else if (e.key === "Escape") {
                              e.stopPropagation();
                              grid.cancelEdit();
                            }
                          }}
                          className="h-full w-full min-w-[160px] bg-surface px-2.5 py-1.5 text-sm text-text-primary outline outline-2 -outline-offset-2 outline-accent-text"
                        />
                      ) : (
                        <>
                          <span className="block font-mono text-[13px]">{cell?.value || <span className={cell?.bad ? "text-danger/70" : "text-text-muted"}>—</span>}</span>
                          {cell?.bad && <span className="mt-0.5 block font-sans text-[11px] font-semibold leading-tight">{cell.short}</span>}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {grid.visibleRows.length === 0 && (
            <tr>
              <td colSpan={headers.length + 1} className="px-6 py-12 text-left text-sm text-text-muted sm:text-center">
                {grid.filter === "errors" ? "Ninguna fila tiene errores." : grid.filter === "edited" ? "Todavía no corriges ninguna celda." : "Ninguna fila coincide con tu búsqueda."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
