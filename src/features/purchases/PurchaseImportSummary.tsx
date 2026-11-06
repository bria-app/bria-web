"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatNumber, soles, units } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PurchaseImportResultDTO } from "@/types/purchasing";

interface Props {
  result: PurchaseImportResultDTO;
  supplierName: string;
  onOpenDocument: (documentId: string) => void;
}

/** What the last spreadsheet upload did: lines, new products and rows with errors. */
export function PurchaseImportSummary({ result, supplierName, onOpenDocument }: Props) {
  // Every row failed: nothing entered the inventory, so it is not shown as a success.
  const nothing = result.created_lines === 0;
  return (
    <section aria-labelledby="import-summary-title" className="space-y-5 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", nothing ? "bg-danger-soft text-danger" : "bg-success-soft text-success")}>
            {nothing ? <AlertTriangle aria-hidden className="h-5 w-5" /> : <CheckCircle2 aria-hidden className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h2 id="import-summary-title" className="font-semibold text-text-primary">
              {nothing ? "No se subió ninguna fila" : "Lo último que subiste"}
            </h2>
            <p className="text-sm text-text-secondary">
              {supplierName} · <span className="font-mono">{formatNumber(result.created_lines)}</span> {result.created_lines === 1 ? "línea" : "líneas"} ·{" "}
              <span className="font-mono">{units(result.units)}</span> · <span className="font-mono">{soles(result.total)}</span> con IGV
            </p>
            <p className="mt-1 text-[12.5px] text-text-muted">
              {formatNumber(result.matched)} {result.matched === 1 ? "producto reconocido" : "productos reconocidos"} · {formatNumber(result.new_products.length)}{" "}
              {result.new_products.length === 1 ? "creado" : "creados"}
              {result.errors.length > 0 && (
                <span className="text-danger">
                  {" "}
                  · {formatNumber(result.errors.length)} {result.errors.length === 1 ? "fila con error" : "filas con error"}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.batch_ids.map((id, i) => (
            <Button key={id} variant="secondary" size="sm" onClick={() => onOpenDocument(id)}>
              {result.batch_ids.length > 1 ? `Ver compra ${i + 1}` : "Ver la compra"}
            </Button>
          ))}
          <Link href="/purchases" className="btn btn-ghost h-9 px-3 text-[13px]">
            Ir a Compras
          </Link>
        </div>
      </div>

      {result.new_products.length > 0 && (
        <div>
          <h3 className="mb-2 text-[12px] font-semibold text-text-muted">Productos nuevos creados</h3>
          <div className="relative max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-soft">
                <tr className="text-[12px] font-semibold text-text-muted">
                  <th scope="col" className="py-2 pl-4 pr-3">Fila</th>
                  <th scope="col" className="px-3 py-2">Código</th>
                  <th scope="col" className="py-2 pl-3 pr-4">Producto</th>
                </tr>
              </thead>
              <tbody>
                {result.new_products.map((p) => (
                  <tr key={p.product_id} className="border-t border-border">
                    <td className="whitespace-nowrap py-2 pl-4 pr-3 font-mono text-[12px] text-text-muted">{p.row ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[13px]">
                      <span className="block max-w-[9rem] truncate" title={p.sku}>
                        {p.sku}
                      </span>
                    </td>
                    <td className="w-full max-w-0 py-2 pl-3 pr-4">
                      <Link href={`/inventory/${p.product_id}`} className="block truncate text-text-primary hover:text-accent-text" title={p.name}>
                        {p.name}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
            <AlertTriangle aria-hidden className="h-4 w-4" /> Filas que no se subieron
          </h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-[12.5px] text-text-secondary">
            {result.errors.map((e) => (
              <li key={`${e.row}-${e.message}`}>
                Fila <span className="font-mono">{e.row}</span>: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
