"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { useApi } from "@/hooks/useApi";
import { purchasingApi } from "@/services/api/purchasing";
import { formatNumber, soles, units } from "@/lib/format";
import type { PurchaseDocumentDetailDTO } from "@/types/purchasing";
import { dayLabel, num, withIgv } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  documentId: string | null;
}

/** One supplier document (factura or boleta): header, lines and totals. */
export function PurchaseDocumentModal({ open, onClose, companyId, documentId }: Props) {
  const doc = useApi<PurchaseDocumentDetailDTO | null>(
    () => (open && companyId && documentId ? purchasingApi.document(companyId, documentId) : Promise.resolve(null)),
    [open, companyId, documentId],
  );
  // While the next purchase loads, the previous one must not show under its title.
  const d = doc.data && doc.data.document_id === documentId ? doc.data : null;
  const subtotal = num(d?.total);
  const { igv, total } = withIgv(subtotal);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={d ? (d.document_number ? `Compra ${d.document_number}` : "Compra sin número") : "Detalle de la compra"}
      description={d ? `${d.supplier_name} · ${dayLabel(d.purchase_date)}` : undefined}
      footer={
        <>
          {/* A deleted supplier has no page left to open. */}
          {d && !d.supplier_deleted && (
            <Link href={`/suppliers/${d.supplier_id}`} className="btn btn-ghost mr-auto h-11 px-4 text-sm">
              Ver proveedor
            </Link>
          )}
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Cerrar
          </Button>
        </>
      }
    >
      <DataState loading={doc.loading || (!d && !doc.error)} error={doc.error} onRetry={doc.reload}>
        {d && (
          <div className="space-y-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Fact label="Proveedor" value={d.supplier_name} sub={d.supplier_ruc ? `RUC ${d.supplier_ruc}` : undefined} />
              <Fact label="Comprobante" value={d.document_number || "Sin número"} mono={!!d.document_number} />
              <Fact label="Entraron" value={units(d.units)} sub={`${d.lines.length} ${d.lines.length === 1 ? "producto" : "productos"}`} mono />
            </dl>
            {d.notes && <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">{d.notes}</p>}

            <div className="@container relative overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-soft">
                  <tr className="text-[12px] font-semibold text-text-muted">
                    <th scope="col" className="px-4 py-2.5">Producto</th>
                    <th scope="col" className="hidden whitespace-nowrap px-3 py-2.5 text-right @md:table-cell">Cantidad</th>
                    <th scope="col" className="hidden whitespace-nowrap px-3 py-2.5 text-right @lg:table-cell">Costo c/u</th>
                    <th scope="col" className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lines.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="w-full max-w-0 py-3 pl-4 pr-3">
                        <Link href={`/inventory/${l.product_id}`} className="block truncate font-semibold text-text-primary hover:text-accent-text">
                          {l.product_name}
                        </Link>
                        <span className="block truncate text-[12px] text-text-muted">
                          <span className="font-mono">{l.sku}</span>
                          <span className="@md:hidden">
                            {" "}
                            · <span className="font-mono">{formatNumber(l.quantity)}</span> × <span className="font-mono">{soles(l.unit_cost)}</span>
                          </span>
                          <span className="hidden @md:inline @lg:hidden">
                            {" "}
                            · <span className="font-mono">{soles(l.unit_cost)}</span> c/u
                          </span>
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-right font-mono @md:table-cell">{formatNumber(l.quantity)}</td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-right font-mono text-text-secondary @lg:table-cell">{soles(l.unit_cost)}</td>
                      <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right font-mono">{soles(l.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <dl className="space-y-1.5">
                <Total label="Subtotal sin IGV" value={soles(subtotal)} />
                <Total label="IGV 18 %" value={soles(igv)} />
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-mono text-lg font-semibold">{soles(total)}</dd>
                </div>
              </dl>
              <p className="text-[12px] text-text-muted">Tus costos se guardan sin IGV.</p>
            </div>
          </div>
        )}
      </DataState>
    </Modal>
  );
}

function Fact({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-semibold text-text-muted">{label}</dt>
      <dd className={mono ? "truncate font-mono text-text-primary" : "truncate font-semibold text-text-primary"}>{value}</dd>
      {sub && <dd className="truncate font-mono text-[12px] text-text-muted">{sub}</dd>}
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
