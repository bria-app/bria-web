"use client";

import { useRouter } from "next/navigation";
import { CLIENT_DOC_LABEL } from "@/features/pos/client";
import { DocumentBadge, OrderStatusBadge } from "@/features/pos/DocumentBadge";
import { cn } from "@/lib/utils";
import { dateTime, soles } from "@/lib/format";
import { DOCUMENT_LABEL, PAYMENT_LABEL, type SalesOrderRow } from "@/types/pos";

const TH = "whitespace-nowrap px-3 py-3 text-[12px] font-semibold text-text-muted";
const TD = "px-3 py-2.5";
const MUTED = "truncate text-[12.5px] text-text-muted";

/**
 * Till sales (and imported ones grouped by comprobante). The whole row opens the sale.
 * Columns step in as the width allows; while one is hidden, its data rides in the first cell.
 */
export function SalesTable({ rows, showSeller, dimmed }: { rows: SalesOrderRow[]; showSeller: boolean; dimmed: boolean }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/sales/${id}`);

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-soft">
          <tr>
            <th className={cn(TH, "pl-4 sm:pl-5")}>Comprobante</th>
            <th className={cn(TH, "hidden xl:table-cell")}>Fecha</th>
            <th className={cn(TH, "hidden lg:table-cell")}>Cliente</th>
            {showSeller && <th className={cn(TH, "hidden 2xl:table-cell")}>Vendedor</th>}
            <th className={cn(TH, "hidden xl:table-cell")}>Pago</th>
            <th className={cn(TH, "text-right max-sm:pr-4")}>Total</th>
            <th className={cn(TH, "hidden pr-5 sm:table-cell")}>Estado</th>
          </tr>
        </thead>
        <tbody className={cn(dimmed && "opacity-60")}>
          {rows.map((o) => {
            const voided = o.status === "voided";
            const client = o.client_name || "Público en general";
            const seller = showSeller && o.seller_name ? o.seller_name : "";
            return (
              <tr
                key={o.id}
                tabIndex={0}
                role="link"
                aria-label={`${DOCUMENT_LABEL[o.document_type]} ${o.document_number}, ${soles(o.total)}`}
                onClick={() => open(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(o.id);
                  }
                }}
                className="h-[52px] cursor-pointer border-t border-border text-[14px] transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft"
              >
                <td className={cn(TD, "w-full max-w-0 overflow-hidden pl-4 sm:pl-5 lg:w-auto lg:max-w-none")}>
                  <span className="hidden sm:inline">
                    <DocumentBadge type={o.document_type} number={o.document_number} />
                  </span>
                  <p className="truncate font-mono text-[13px] text-text-primary sm:hidden">{o.document_number || DOCUMENT_LABEL[o.document_type]}</p>
                  <p className={cn(MUTED, "xl:hidden")}>
                    <span className="sm:hidden">{DOCUMENT_LABEL[o.document_type]} · </span>
                    {dateTime(o.sold_at)}
                    {voided && <span className="text-danger sm:hidden"> · Anulada</span>}
                  </p>
                  <p className={cn(MUTED, "lg:hidden")}>
                    {client}
                    {seller && ` · ${seller}`}
                  </p>
                </td>
                <td className={cn(TD, "hidden whitespace-nowrap text-text-secondary xl:table-cell")}>{dateTime(o.sold_at)}</td>
                <td className={cn(TD, "hidden lg:table-cell lg:w-full lg:max-w-0")}>
                  <p className="truncate text-text-primary">{client}</p>
                  {o.client_doc_number && (
                    <p className="truncate font-mono text-[12px] text-text-muted">
                      {CLIENT_DOC_LABEL[o.client_doc_type] ?? "Doc."} {o.client_doc_number}
                    </p>
                  )}
                  {seller && <p className={cn(MUTED, "2xl:hidden")}>Vendedor: {seller}</p>}
                </td>
                {showSeller && (
                  <td className={cn(TD, "hidden text-text-secondary 2xl:table-cell")}>
                    <span className="block max-w-[180px] truncate">{o.seller_name || "—"}</span>
                  </td>
                )}
                <td className={cn(TD, "hidden whitespace-nowrap text-text-secondary xl:table-cell")}>{PAYMENT_LABEL[o.payment_method] ?? o.payment_method}</td>
                <td
                  className={cn(
                    TD,
                    "whitespace-nowrap text-right font-mono max-sm:pr-4",
                    voided ? "text-text-muted line-through" : "text-text-primary",
                  )}
                >
                  {soles(o.total)}
                </td>
                <td className={cn(TD, "hidden pr-5 sm:table-cell")}>
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
