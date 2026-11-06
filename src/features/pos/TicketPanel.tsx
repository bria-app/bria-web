"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { soles, units } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DOCUMENT_LABEL, PAYMENT_LABEL, type SalesDocumentType } from "@/types/pos";
import { ClientSection } from "./ClientSection";
import { PaymentSection } from "./PaymentSection";
import { TicketLineRow } from "./TicketLineRow";
import { TotalsList } from "./TotalsList";
import type { Till } from "./useTill";

const DOCS = Object.keys(DOCUMENT_LABEL) as SalesDocumentType[];

/** Right-hand sale panel: comprobante type, who it is for, the lines, totals, payment and «Cobrar». */
export function TicketPanel({ till }: { till: Till }) {
  const [openLine, setOpenLine] = useState<string | null>(null);
  const { lines, totals } = till;
  const blocked = till.problem ?? till.error;

  return (
    <section
      aria-label="Venta actual"
      className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft lg:sticky lg:top-0 lg:max-h-[calc(100vh-8.5rem)]"
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <div role="radiogroup" aria-label="Tipo de comprobante" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1">
          {DOCS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={till.doc === d}
              onClick={() => till.setDoc(d)}
              className={cn(
                "h-11 rounded-lg px-1 text-[13px] font-semibold transition-colors",
                till.doc === d ? "bg-surface text-text-primary shadow-soft" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {DOCUMENT_LABEL[d]}
            </button>
          ))}
        </div>
        <ClientSection doc={till.doc} client={till.client} onClient={till.setClient} onDoc={till.setDoc} total={totals.total} />
        {till.doc === "nota_venta" && (
          <p className="text-[12.5px] text-text-muted">La nota de venta es para tu control: no es comprobante de pago.</p>
        )}
      </div>

      <div className="min-h-[96px] flex-1 overflow-y-auto px-2 py-1.5">
        {lines.length === 0 ? (
          <p className="px-3 py-8 text-center text-[14px] text-text-muted">Toca un producto o escanéalo para empezar.</p>
        ) : (
          <ul className="flex flex-col">
            {lines.map((line) => (
              <TicketLineRow
                key={line.product.id}
                line={line}
                open={openLine === line.product.id}
                onToggle={() => setOpenLine((id) => (id === line.product.id ? null : line.product.id))}
                onQuantity={(q) => till.setQuantity(line.product.id, q)}
                onPatch={(patch) => till.patchLine(line.product.id, patch)}
                onRemove={() => till.remove(line.product.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-border p-4">
        {lines.length > 0 && (
          <div className="flex items-center justify-between text-[12.5px] text-text-muted">
            <span>
              {lines.length} {lines.length === 1 ? "producto" : "productos"} · <span className="font-mono">{units(totals.units)}</span>
            </span>
            <Button variant="ghost" onClick={till.clear} className="-mr-2">
              Vaciar venta
            </Button>
          </div>
        )}
        <TotalsList gross={totals.gross} discount={totals.discount} subtotal={totals.subtotal} igv={totals.igv} total={totals.total} />
        <PaymentSection
          method={till.payment}
          onMethod={till.setPayment}
          received={till.received}
          onReceived={till.setReceived}
          total={totals.total}
        />
        {lines.length > 0 && blocked && (
          <p role="status" className="rounded-xl bg-warning-soft px-3 py-2 text-[13px] font-semibold text-warning">
            {blocked}
          </p>
        )}
        <Button
          size="lg"
          onClick={() => void till.checkout()}
          disabled={!lines.length || !!till.problem || till.submitting}
          aria-busy={till.submitting || undefined}
          aria-keyshortcuts="F9"
          className="h-16 w-full flex-col gap-0 rounded-2xl text-[17px] font-bold"
        >
          <span>{till.submitting ? "Registrando…" : lines.length ? `Cobrar ${soles(totals.total)}` : "Cobrar"}</span>
          <span className="text-[11.5px] font-semibold opacity-75">
            {DOCUMENT_LABEL[till.doc]} · {PAYMENT_LABEL[till.payment]} · F9
          </span>
        </Button>
      </div>
    </section>
  );
}
