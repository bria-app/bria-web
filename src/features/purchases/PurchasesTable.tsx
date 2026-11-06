"use client";

import Link from "next/link";
import { ListStatus } from "@/components/ui/ListStatus";
import type { ListView } from "@/hooks/useDevicePref";
import type { InfiniteList } from "@/hooks/useInfiniteList";
import { formatNumber, soles } from "@/lib/format";
import type { PurchaseDocumentDTO } from "@/types/purchasing";
import { cn } from "@/lib/utils";
import { dayLabel, num } from "./format";
import { PurchasesBoard } from "./PurchasesBoard";

const TH = "whitespace-nowrap px-3 py-3";

interface Props {
  list: InfiniteList<PurchaseDocumentDTO>;
  onOpen: (documentId: string) => void;
  /** Inside a supplier's page the supplier column is redundant. */
  hideSupplier?: boolean;
  /** The same purchases as a table or as cards. */
  view?: ListView;
}

/** Purchase documents, newest first. A row opens the document. */
export function PurchasesTable({ list, onOpen, hideSupplier = false, view = "tabla" }: Props) {
  if (view === "tarjetas") {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <PurchasesBoard items={list.items} onOpen={onOpen} hideSupplier={hideSupplier} />
        <PurchasesStatus list={list} variant="cards" />
      </div>
    );
  }

  return (
    <div className="overflow-clip rounded-2xl border border-border bg-surface">
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft">
            <tr className="text-[12px] font-semibold text-text-muted">
              <th scope="col" className={cn(TH, hideSupplier ? "pl-4 sm:pl-5" : "hidden pl-5 lg:table-cell")}>Fecha</th>
              {!hideSupplier && <th scope="col" className={cn(TH, "pl-4 sm:pl-5 lg:pl-3")}>Proveedor</th>}
              <th scope="col" className={cn(TH, "hidden sm:table-cell")}>Comprobante</th>
              <th scope="col" className={cn(TH, "hidden text-right", hideSupplier ? "lg:table-cell" : "xl:table-cell")}>Productos</th>
              <th scope="col" className={cn(TH, "hidden text-right", hideSupplier ? "sm:table-cell" : "lg:table-cell")}>Unidades</th>
              <th scope="col" className={cn(TH, "pr-4 text-right sm:pr-5")}>Total sin IGV</th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((d) => {
              const label = `Ver la compra ${d.document_number || "sin número"} de ${d.supplier_name}`;
              const open = (e: React.MouseEvent) => {
                e.stopPropagation();
                onOpen(d.document_id);
              };
              const doc = d.document_number ? <span className="font-mono">{d.document_number}</span> : <span className="text-text-muted">Sin número</span>;
              return (
                <tr key={d.document_id} onClick={() => onOpen(d.document_id)} className="h-[52px] cursor-pointer border-t border-border transition-colors hover:bg-surface-soft">
                  <td className={cn("whitespace-nowrap py-2.5 pr-3 text-text-secondary", hideSupplier ? "w-full max-w-0 pl-4 sm:w-auto sm:max-w-none sm:pl-5" : "hidden pl-5 lg:table-cell")}>
                    {dayLabel(d.purchase_date)}
                    {hideSupplier && (
                      <button type="button" onClick={open} aria-label={label} className="block max-w-full truncate rounded-md text-left text-[12.5px] hover:text-accent-text sm:hidden">
                        {doc}
                      </button>
                    )}
                  </td>
                  {!hideSupplier && (
                    <td className="w-full max-w-0 py-2.5 pl-4 pr-3 sm:pl-5 lg:pl-3">
                      {d.supplier_deleted ? (
                        // A deleted supplier has no page left to open.
                        <span className="block truncate font-semibold text-text-secondary">{d.supplier_name}</span>
                      ) : (
                        <Link href={`/suppliers/${d.supplier_id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold text-text-primary hover:text-accent-text">
                          {d.supplier_name}
                        </Link>
                      )}
                      <span className="block truncate text-[12.5px] text-text-muted">
                        <span className="lg:hidden">{dayLabel(d.purchase_date)}</span>
                        <span className="sm:hidden">
                          {" · "}
                          <button type="button" onClick={open} aria-label={label} className="rounded-md hover:text-accent-text">
                            {doc}
                          </button>
                        </span>
                        {d.supplier_ruc && <span className="hidden font-mono lg:inline">RUC {d.supplier_ruc}</span>}
                      </span>
                    </td>
                  )}
                  <td className={cn("hidden whitespace-nowrap px-3 py-2.5 sm:table-cell", hideSupplier && "w-full max-w-0")}>
                    <button type="button" onClick={open} className="block max-w-full truncate rounded-md text-left hover:text-accent-text" aria-label={label}>
                      {doc}
                    </button>
                  </td>
                  <td className={cn("hidden px-3 py-2.5 text-right font-mono", hideSupplier ? "lg:table-cell" : "xl:table-cell")}>{formatNumber(d.lines)}</td>
                  <td className={cn("hidden px-3 py-2.5 text-right font-mono", hideSupplier ? "sm:table-cell" : "lg:table-cell")}>{formatNumber(d.units)}</td>
                  <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono font-semibold sm:pr-5">{soles(d.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PurchasesStatus list={list} variant="table" />
    </div>
  );
}

/** How many there are and what those on screen add up to, shared by the table and the cards. */
function PurchasesStatus({ list, variant }: { list: InfiniteList<PurchaseDocumentDTO>; variant: "table" | "cards" }) {
  const total = list.total ?? list.items.length;
  const shownTotal = list.items.reduce((acc, d) => acc + num(d.total), 0);
  const partial = list.items.length < total;
  return (
    <ListStatus variant={variant} loading={list.loadingMore} onRetry={list.moreFailed ? list.loadMore : undefined}>
      {partial && `Viendo ${formatNumber(list.items.length)} de `}
      {formatNumber(total)} {total === 1 ? "compra" : "compras"} · {partial ? "estas suman " : "suman "}
      <span className="font-mono">{soles(shownTotal)}</span> sin IGV
    </ListStatus>
  );
}
