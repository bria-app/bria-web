"use client";

import { CardGrid } from "@/components/ui/CardGrid";
import { formatNumber, soles, units } from "@/lib/format";
import type { PurchaseDocumentDTO } from "@/types/purchasing";
import { dayLabel } from "./format";

interface Props {
  items: PurchaseDocumentDTO[];
  onOpen: (documentId: string) => void;
  hideSupplier: boolean;
}

/** Purchase documents as cards. A card opens the document, like the row. */
export function PurchasesBoard({ items, onOpen, hideSupplier }: Props) {
  return (
    <CardGrid
      items={items}
      getKey={(d) => d.document_id}
      label="Compras"
      renderCard={(d) => <PurchaseCard d={d} onOpen={onOpen} hideSupplier={hideSupplier} />}
    />
  );
}

function PurchaseCard({ d, onOpen, hideSupplier }: { d: PurchaseDocumentDTO; onOpen: (documentId: string) => void; hideSupplier: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(d.document_id)}
      aria-label={`Ver la compra ${d.document_number || "sin número"} de ${d.supplier_name}`}
      className="flex h-full w-full flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-text-muted/40"
    >
      <div className="w-full min-w-0">
        {!hideSupplier && <p className="truncate font-semibold text-text-primary">{d.supplier_name}</p>}
        <p className="truncate text-[12.5px] text-text-muted">
          {dayLabel(d.purchase_date)}
          {!hideSupplier && d.supplier_ruc && (
            <>
              {" · "}
              <span className="font-mono">RUC {d.supplier_ruc}</span>
            </>
          )}
        </p>
      </div>

      <p className="w-full truncate text-[13px] text-text-secondary">
        {d.document_number ? <span className="font-mono">{d.document_number}</span> : <span className="text-text-muted">Sin número</span>}
      </p>

      <div className="mt-auto flex w-full items-end justify-between gap-2 border-t border-border pt-2.5">
        <span className="min-w-0 truncate text-[12.5px] text-text-muted">
          <span className="font-mono text-text-secondary">{formatNumber(d.lines)}</span> {d.lines === 1 ? "producto" : "productos"} ·{" "}
          <span className="whitespace-nowrap font-mono text-text-secondary">{units(d.units)}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[11px] text-text-muted">Total sin IGV</span>
          <span className="font-mono text-[16px] font-semibold text-text-primary">{soles(d.total)}</span>
        </span>
      </div>
    </button>
  );
}
