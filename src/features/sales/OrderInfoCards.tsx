import { Card } from "@/components/ui/Card";
import { percent, soles } from "@/lib/format";
import { PAYMENT_LABEL, type SalesOrder } from "@/types/pos";
import { CLIENT_DOC_LABEL } from "@/features/pos/client";

/** Client, payment and comprobante facts; cost and margin only for roles that may see them. */
export function OrderInfoCards({ order: o, showCost }: { order: SalesOrder; showCost: boolean }) {
  const net = Number(o.subtotal);
  return (
    <div className="flex flex-col gap-4">
      <Info title="Cliente">
        <p className="font-medium text-text-primary">{o.client_name || "Público en general"}</p>
        {o.client_doc_number && (
          <p className="font-mono text-[13px] text-text-secondary">
            {CLIENT_DOC_LABEL[o.client_doc_type] ?? "Doc."} {o.client_doc_number}
          </p>
        )}
        {o.client_address && <p className="text-[13px] text-text-secondary">{o.client_address}</p>}
      </Info>

      <Info title="Pago">
        <Row label="Forma de pago" value={PAYMENT_LABEL[o.payment_method] ?? o.payment_method} />
        {o.amount_received != null && <Row label="Recibido" value={soles(o.amount_received)} mono />}
        {o.change != null && <Row label="Vuelto" value={soles(o.change)} mono />}
        <Row label="Atendió" value={o.seller_name || "—"} />
      </Info>

      <Info title="Comprobante">
        {o.invoice_id ? (
          <>
            <Row label="Estado" value={o.invoice_status === "anulada" ? "Anulado" : "Emitido"} />
            <p className="text-[12.5px] text-text-muted">bria registra el comprobante pero no lo envía a SUNAT.</p>
          </>
        ) : (
          <p className="text-[13px] text-text-secondary">Nota de venta: documento interno, no es comprobante de pago.</p>
        )}
      </Info>

      {o.notes && o.status !== "voided" && (
        <Info title="Notas">
          <p className="text-[13px] text-text-secondary">{o.notes}</p>
        </Info>
      )}

      {/* The API sends null costs to roles that may not see them: then the card is not drawn at all. */}
      {showCost && o.cost_total != null && (
        <Info title="Costo y ganancia">
          <Row label="Costo de lo vendido" value={soles(o.cost_total)} mono />
          <Row label="Ganancia (sin IGV)" value={o.gross_margin == null ? "—" : soles(o.gross_margin)} mono />
          {net > 0 && o.gross_margin != null && <Row label="Margen" value={percent(Number(o.gross_margin) / net, 1)} mono />}
        </Info>
      )}
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <h2 className="text-[13px] font-semibold text-text-secondary">{title}</h2>
      {children}
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-[14px]">
      <span className="text-text-secondary">{label}</span>
      <span className={mono ? "text-right font-mono text-text-primary" : "text-right text-text-primary"}>{value}</span>
    </div>
  );
}
