"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useProfile } from "@/hooks/useProfile";
import { useRole } from "@/hooks/useRole";
import { posApi } from "@/services/api/pos";
import { dateTime } from "@/lib/format";
import { DocumentBadge, OrderStatusBadge } from "@/features/pos/DocumentBadge";
import { ReceiptPreview } from "@/features/invoicing/ReceiptPreview";
import { OrderInfoCards } from "@/features/sales/OrderInfoCards";
import { OrderLinesCard } from "@/features/sales/OrderLinesCard";
import { VoidOrderModal } from "@/features/sales/VoidOrderModal";
import { tookNoStock } from "@/features/sales/orderOrigin";
import { DOCUMENT_LABEL, type SalesOrder } from "@/types/pos";

export default function SaleDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const companyId = useCompanyId();
  const { company } = useProfile();
  const { isSeller, isAdmin } = useRole();
  const toast = useToast();
  const order = useApi(
    () => (companyId && orderId ? posApi.get(companyId, orderId) : Promise.resolve(null)),
    [companyId, orderId],
  );
  const [voided, setVoided] = useState<SalesOrder | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const o = voided ?? order.data;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <Link href="/sales" className="inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-text-secondary hover:text-accent-text">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Volver a ventas
      </Link>

      <DataState
        loading={order.loading && !o}
        error={order.error}
        empty={!order.loading && !o}
        emptyMessage="No encontramos esta venta."
        onRetry={order.reload}
      >
        {o && companyId && (
          <>
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-mono text-[26px] font-semibold tracking-tight text-text-primary">{o.document_number}</h1>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-text-secondary">
                  <DocumentBadge type={o.document_type} />
                  <span>{dateTime(o.sold_at)}</span>
                  <span>
                    Venta <span className="font-mono">#{o.order_number}</span>
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setReceiptOpen(true)}>
                  <Printer aria-hidden className="h-4 w-4" /> Ver {DOCUMENT_LABEL[o.document_type].toLowerCase()}
                </Button>
                {isAdmin && o.status === "completed" && (
                  <Button variant="danger" onClick={() => setVoidOpen(true)}>
                    <Ban aria-hidden className="h-4 w-4" /> Anular venta
                  </Button>
                )}
              </div>
            </header>

            {o.status === "voided" && (
              <p role="status" className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
                {voidedText(o)}
                {o.notes ? ` ${o.notes.replace(/\.$/, "")}.` : ""}
              </p>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <OrderLinesCard order={o} linkProducts={!isSeller} />
              <OrderInfoCards order={o} showCost={!isSeller} />
            </div>

            <ReceiptPreview order={o} company={company} open={receiptOpen} onClose={() => setReceiptOpen(false)} />
            {isAdmin && (
              <VoidOrderModal
                open={voidOpen}
                order={o}
                companyId={companyId}
                onClose={() => setVoidOpen(false)}
                onVoided={(next) => {
                  setVoided(next);
                  setVoidOpen(false);
                  toast(tookNoStock(next) ? "Venta anulada. Tu inventario no cambió." : "Venta anulada. Las unidades volvieron al inventario.");
                }}
              />
            )}
          </>
        )}
      </DataState>
    </div>
  );
}

/** Banner of a voided sale: imported history gave no units back, a till sale did. */
function voidedText(o: SalesOrder): string {
  const invoice = o.invoice_id ? " y el comprobante quedó anulado" : "";
  return tookNoStock(o) ? `Venta anulada${invoice}. Era historial importado: tu inventario no cambió.` : `Venta anulada. Las unidades volvieron al inventario${invoice}.`;
}
