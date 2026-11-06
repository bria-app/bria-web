import { CLIENT_DOC_LABEL } from "@/features/pos/client";
import { amountInWords } from "@/features/pos/peru";
import { dateTime, formatNumber } from "@/lib/format";
import type { CompanyDTO } from "@/types/api";
import { PAYMENT_LABEL, type SalesOrder } from "@/types/pos";

const money = (v: number | string | null | undefined) => formatNumber(v, 2);

const DOC_TITLE: Record<SalesOrder["document_type"], string> = {
  boleta: "BOLETA DE VENTA ELECTRÓNICA",
  factura: "FACTURA ELECTRÓNICA",
  nota_venta: "NOTA DE VENTA",
};

/** The printed comprobante (80 mm thermal paper), built only from the sale the backend returned. Screen and print share it. */
export function Ticket({ order, company }: { order: SalesOrder; company: CompanyDTO | null }) {
  const voided = order.status === "voided";

  return (
    <div className="pos-ticket relative mx-auto flex w-[302px] flex-col gap-1.5 rounded-md border border-border bg-surface px-4 py-5 font-mono text-[11.5px] leading-[1.5] text-text-primary">
      {voided && (
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="-rotate-12 rounded-md border-4 border-danger px-3 py-1 text-2xl font-black tracking-widest text-danger opacity-70">
            ANULADO
          </span>
        </div>
      )}
      <div className="text-center">
        <p className="font-display text-[16px] font-bold">{company?.name ?? "Tu negocio"}</p>
        {company?.tax_id && <p>RUC {company.tax_id}</p>}
        {company?.address && <p>{company.address}</p>}
        {company?.phone && <p>Tel. {company.phone}</p>}
      </div>
      <Divider />
      <div className="text-center font-bold">
        <p>{DOC_TITLE[order.document_type]}</p>
        <p className="text-[13px]">{order.document_number}</p>
      </div>
      <Divider />
      <Row label="Fecha" value={dateTime(order.sold_at)} />
      <Row label="Venta" value={`#${order.order_number}`} />
      <Row label="Atendió" value={order.seller_name || "—"} />
      <Row label="Cliente" value={order.client_name || "Público en general"} />
      {order.client_doc_number && <Row label={CLIENT_DOC_LABEL[order.client_doc_type] ?? "Doc."} value={order.client_doc_number} />}
      {order.client_address && <Row label="Dir." value={order.client_address} />}
      <Divider />
      {order.lines.map((l) => (
        <div key={l.id}>
          <p className="uppercase">{l.product_name}</p>
          <div className="flex justify-between gap-2">
            <span>
              {l.quantity} × {money(l.unit_price)}
              {Number(l.discount) > 0 && ` − ${money(l.discount)}`}
            </span>
            <span>{money(l.line_total)}</span>
          </div>
        </div>
      ))}
      <Divider />
      {Number(order.discount_total) > 0 && <Row label="Descuentos" value={`−${money(order.discount_total)}`} />}
      {order.document_type !== "nota_venta" && (
        <>
          <Row label="Op. gravada" value={money(order.subtotal)} />
          <Row label="IGV 18 %" value={money(order.igv)} />
        </>
      )}
      <div className="flex justify-between text-[14px] font-bold">
        <span>TOTAL S/</span>
        <span>{money(order.total)}</span>
      </div>
      <p className="text-[10.5px]">{amountInWords(Number(order.total))}</p>
      <Divider />
      <Row label="Pago" value={PAYMENT_LABEL[order.payment_method] ?? order.payment_method} />
      {order.payment_method === "efectivo" && order.amount_received != null && (
        <>
          <Row label="Recibido" value={money(order.amount_received)} />
          <Row label="Vuelto" value={money(order.change)} />
        </>
      )}
      <Divider />
      <p className="text-center text-[10.5px]">
        {order.document_type === "nota_venta"
          ? "Documento interno, no es comprobante de pago."
          : "Representación impresa. bria no envía comprobantes a SUNAT."}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="my-1 border-t border-dashed border-border" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
