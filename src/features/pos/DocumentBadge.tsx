import { Badge } from "@/components/ui/Badge";
import { DOCUMENT_LABEL, type OrderStatus, type SalesDocumentType } from "@/types/pos";

/** Comprobante type + number, e.g. [Boleta] B001-00000012. */
export function DocumentBadge({ type, number }: { type: SalesDocumentType; number?: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Badge tone={type === "nota_venta" ? "neutral" : "accent"}>{DOCUMENT_LABEL[type]}</Badge>
      {number && <span className="font-mono text-[13px] text-text-secondary">{number}</span>}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return status === "voided" ? <Badge tone="danger">Anulada</Badge> : <Badge tone="success">Pagada</Badge>;
}
