"use client";

import { createPortal } from "react-dom";
import { Plus, Printer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { soles } from "@/lib/format";
import type { CompanyDTO } from "@/types/api";
import { DOCUMENT_LABEL, type SalesOrder } from "@/types/pos";
import { Ticket } from "./Ticket";

// Paper is always black on white, whatever the screen theme.
const PRINT_CSS = `
#pos-print-root { display: none; }
@media print {
  @page { size: 80mm auto; margin: 0; }
  body > *:not(#pos-print-root) { display: none !important; }
  #pos-print-root { display: block !important; }
  #pos-print-root .pos-ticket { width: 80mm !important; padding: 4mm !important; border: 0 !important; background: white !important; color: black !important; }
  #pos-print-root .pos-ticket * { color: black !important; border-color: black !important; }
}
`;

interface ReceiptPreviewProps {
  order: SalesOrder | null;
  company: CompanyDTO | null;
  open: boolean;
  onClose: () => void;
  /** After a checkout: the main action goes back to an empty till. */
  onNewSale?: () => void;
}

/** Comprobante shown right after charging, and for reprints from the sale detail. */
export function ReceiptPreview({ order, company, open, onClose, onNewSale }: ReceiptPreviewProps) {
  if (!order) return null;
  const change = order.change != null && Number(order.change) > 0 ? ` · Vuelto ${soles(order.change)}` : "";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={onNewSale ? `Cobrado ${soles(order.total)}` : `${DOCUMENT_LABEL[order.document_type]} ${order.document_number}`}
        description={onNewSale ? `${DOCUMENT_LABEL[order.document_type]} ${order.document_number}${change}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden className="h-4 w-4" /> Imprimir
            </Button>
            {onNewSale ? (
              <Button onClick={onNewSale} autoFocus>
                <Plus aria-hidden className="h-4 w-4" /> Nueva venta
              </Button>
            ) : (
              <Button variant="strong" onClick={onClose} autoFocus>
                Cerrar
              </Button>
            )}
          </>
        }
      >
        {onNewSale && (
          <div aria-hidden className="mb-4 flex justify-center">
            {/* Right after charging: a check draws itself, then the comprobante comes out of the printer. */}
            <svg viewBox="0 0 52 52" className="h-14 w-14">
              <circle cx="26" cy="26" r="23" pathLength={1} fill="none" strokeWidth={3} className="ok-circle stroke-success" />
              <path d="M15 27l7 7 15-16" pathLength={1} fill="none" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" className="ok-check stroke-success" />
            </svg>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl bg-surface-muted py-5">
          <div className={onNewSale ? "ticket-print" : undefined}>
            <Ticket order={order} company={company} />
          </div>
        </div>
      </Modal>
      {open &&
        createPortal(
          <div id="pos-print-root">
            <style>{PRINT_CSS}</style>
            <Ticket order={order} company={company} />
          </div>,
          document.body,
        )}
    </>
  );
}
