"use client";

import Link from "next/link";
import { DocumentBadge, OrderStatusBadge } from "@/features/pos/DocumentBadge";
import { CardGrid } from "@/components/ui/CardGrid";
import { dateTime, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DOCUMENT_LABEL, PAYMENT_LABEL, type SalesOrderRow } from "@/types/pos";

/** Sales as cards. A card opens the sale, like the row. */
export function SalesBoard({ rows, showSeller, dimmed }: { rows: SalesOrderRow[]; showSeller: boolean; dimmed: boolean }) {
  return (
    <div className={cn("min-w-0 transition-opacity", dimmed && "opacity-60")}>
      <CardGrid items={rows} getKey={(o) => o.id} label="Ventas" renderCard={(o) => <SaleCard o={o} showSeller={showSeller} />} />
    </div>
  );
}

function SaleCard({ o, showSeller }: { o: SalesOrderRow; showSeller: boolean }) {
  const voided = o.status === "voided";
  const payment = PAYMENT_LABEL[o.payment_method] ?? o.payment_method;
  const seller = showSeller && o.seller_name ? o.seller_name : "";
  return (
    <Link
      href={`/sales/${o.id}`}
      aria-label={`${DOCUMENT_LABEL[o.document_type]} ${o.document_number}, ${soles(o.total)}`}
      className="flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text-muted/40"
    >
      <span className="block min-w-0 overflow-hidden">
        <DocumentBadge type={o.document_type} number={o.document_number} />
      </span>

      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-text-primary">{o.client_name || "Público en general"}</p>
          <p className="truncate text-[12.5px] text-text-muted">
            {dateTime(o.sold_at)}
            {seller && ` · ${seller}`}
          </p>
        </div>
        <OrderStatusBadge status={o.status} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-2.5">
        <span className="truncate text-[12.5px] text-text-secondary">{payment}</span>
        <span className={cn("shrink-0 font-mono text-[18px] font-semibold", voided ? "text-text-muted line-through" : "text-text-primary")}>{soles(o.total)}</span>
      </div>
    </Link>
  );
}
