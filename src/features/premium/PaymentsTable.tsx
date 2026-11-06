import { shortDate, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentDTO } from "@/types/billing";
import { CYCLE_LABEL, METHOD_LABEL } from "./plan-data";

const STATUS_LABEL: Record<string, string> = { paid: "Pagado", failed: "Rechazado", refunded: "Devuelto" };
const TH = "whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold text-text-muted";
const TD = "whitespace-nowrap px-3";

/**
 * GET /billing/payments, newest first as the backend returns them. It lives in narrow
 * places (settings, the plan page), so columns step in by the box's own width, and
 * while one is hidden its value rides under the date or the amount.
 */
export function PaymentsTable({ payments }: { payments: PaymentDTO[] }) {
  if (payments.length === 0) {
    return <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">Todavía no hay pagos registrados.</p>;
  }
  return (
    <div className="@container relative overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-surface-soft">
          <tr>
            <th scope="col" className={cn(TH, "pl-4")}>Fecha</th>
            <th scope="col" className={cn(TH, "hidden @4xl:table-cell")}>Referencia</th>
            <th scope="col" className={cn(TH, "hidden @xl:table-cell")}>Plan</th>
            <th scope="col" className={cn(TH, "hidden @2xl:table-cell")}>Método</th>
            <th scope="col" className={cn(TH, "pr-4 text-right @md:pr-3")}>Monto</th>
            <th scope="col" className={cn(TH, "hidden pr-4 @md:table-cell")}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const plan = `Premium ${CYCLE_LABEL[p.billing_cycle]?.toLowerCase() ?? p.billing_cycle}`;
            const method = (
              <>
                {METHOD_LABEL[p.method] ?? p.method}
                {p.card_last4 && <span className="font-mono"> ···· {p.card_last4}</span>}
              </>
            );
            const status = STATUS_LABEL[p.status] ?? p.status;
            return (
              <tr key={p.id} className="h-[52px] border-t border-border">
                <td className="w-full max-w-0 py-2 pl-4 pr-3">
                  <span className="block truncate text-text-secondary">{shortDate(p.paid_at)}</span>
                  <span className="block truncate text-[12.5px] text-text-muted @2xl:hidden">
                    {method}
                    <span className="@xl:hidden"> · {plan}</span>
                  </span>
                  <span className="block truncate font-mono text-[12px] text-text-muted @4xl:hidden">{p.reference}</span>
                </td>
                <td className={cn(TD, "hidden font-mono text-[13px] @4xl:table-cell")}>{p.reference}</td>
                <td className={cn(TD, "hidden @xl:table-cell")}>{plan}</td>
                <td className={cn(TD, "hidden @2xl:table-cell")}>{method}</td>
                <td className={cn(TD, "pr-4 text-right font-mono @md:pr-3")}>
                  {soles(p.amount)}
                  <span className="block font-sans text-[12.5px] text-text-muted @md:hidden">{status}</span>
                </td>
                <td className={cn(TD, "hidden pr-4 @md:table-cell")}>{status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
