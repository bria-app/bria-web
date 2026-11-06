"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNumber, soles, units } from "@/lib/format";
import type { PurchaseBatchResultDTO } from "@/types/purchasing";
import { dayLabel } from "./format";
import { useOpenedOnce } from "@/components/ui/lazyDialog";
import { PurchaseDocumentModal } from "./lazyPurchaseDocument";

interface Props {
  companyId: string | null;
  result: PurchaseBatchResultDTO;
  supplierName: string;
  onAnother: () => void;
}

/** What changed after registering: units before and after, and the new average cost. */
export function PurchaseResult({ companyId, result, supplierName, onAnother }: Props) {
  const [docOpen, setDocOpen] = useState(false);
  const docLoaded = useOpenedOnce(docOpen);
  const isNew = new Set(result.new_products.map((n) => n.product_id));

  return (
    <section aria-labelledby="purchase-done-title" className="space-y-6 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 aria-hidden className="h-7 w-7" />
        </span>
        <h2 id="purchase-done-title" className="font-display text-2xl font-bold tracking-[-0.02em] text-text-primary">
          Compra registrada
        </h2>
        <p className="max-w-xl text-sm text-text-secondary">
          {supplierName} · {result.document_number ? <span className="font-mono">{result.document_number}</span> : "sin número"} ·{" "}
          {dayLabel(result.purchase_date)}. Entraron <span className="font-mono font-semibold text-text-primary">{units(result.units)}</span> por{" "}
          <span className="font-mono font-semibold text-text-primary">{soles(result.total)}</span> con IGV.
        </p>
      </div>

      <div className="@container relative overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-soft">
            <tr className="text-[12px] font-semibold text-text-muted">
              <th scope="col" className="px-4 py-2.5">Producto</th>
              <th scope="col" className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right @md:pr-3">Entró</th>
              <th scope="col" className="hidden whitespace-nowrap py-2.5 pl-3 pr-4 text-right @md:table-cell @xl:pr-3">Quedan</th>
              <th scope="col" className="hidden whitespace-nowrap py-2.5 pl-3 pr-4 text-right @xl:table-cell">Costo promedio</th>
            </tr>
          </thead>
          <tbody>
            {result.stock_changes.map((c) => (
              <tr key={c.product_id} className="border-t border-border">
                <td className="w-full max-w-0 py-3 pl-4 pr-3">
                  <Link href={`/inventory/${c.product_id}`} className="block truncate font-semibold text-text-primary hover:text-accent-text">
                    {c.name}
                  </Link>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-[12px] text-text-muted">{c.sku}</span>
                    {isNew.has(c.product_id) && <Badge tone="accent">Nuevo</Badge>}
                  </span>
                  <span className="block truncate text-[12.5px] text-text-muted @xl:hidden">
                    Costo promedio <span className="font-mono">{soles(c.previous_avg_cost)}</span> <Arrow /> <span className="font-mono text-text-secondary">{soles(c.new_avg_cost)}</span>
                    <span className="@md:hidden">
                      {" "}
                      · quedan <span className="font-mono">{formatNumber(c.previous_stock)}</span> <Arrow />{" "}
                      <span className="font-mono text-text-secondary">{formatNumber(c.new_stock)}</span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right font-mono font-semibold text-success @md:pr-3">+{formatNumber(c.quantity)}</td>
                <td className="hidden whitespace-nowrap py-3 pl-3 pr-4 text-right font-mono text-text-secondary @md:table-cell @xl:pr-3">
                  {formatNumber(c.previous_stock)} <Arrow /> <span className="text-text-primary">{formatNumber(c.new_stock)}</span>
                </td>
                <td className="hidden whitespace-nowrap py-3 pl-3 pr-4 text-right font-mono text-text-secondary @xl:table-cell">
                  {soles(c.previous_avg_cost)} <Arrow /> <span className="text-text-primary">{soles(c.new_avg_cost)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={() => setDocOpen(true)}>
          Ver la compra
        </Button>
        <Link href="/purchases" className="btn btn-secondary h-11 px-4 text-sm">
          Ir a Compras
        </Link>
        <Button variant="primary" onClick={onAnother} data-autofocus>
          Registrar otra compra
        </Button>
      </div>

      {docLoaded && <PurchaseDocumentModal open={docOpen} onClose={() => setDocOpen(false)} companyId={companyId} documentId={result.batch_id} />}
    </section>
  );
}

function Arrow() {
  return <ArrowRight aria-label="pasa a" className="inline h-3 w-3" />;
}
