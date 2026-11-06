import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TotalsList } from "@/features/pos/TotalsList";
import { cn } from "@/lib/utils";
import { soles, units } from "@/lib/format";
import type { SalesOrder } from "@/types/pos";

const TH = "whitespace-nowrap px-3 py-3 text-[12px] font-semibold text-text-muted";

/** Lines and totals exactly as the backend stored them. Product links only for roles that can open the catalog. */
export function OrderLinesCard({ order, linkProducts }: { order: SalesOrder; linkProducts: boolean }) {
  const gross = order.lines.reduce((acc, l) => acc + Number(l.unit_price) * l.quantity, 0);

  return (
    <Card className="overflow-hidden p-0">
      {/* Sized by its own box (it sits beside the totals from lg up), not by the viewport. */}
      <div className="@container relative overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-soft">
            <tr>
              <th className={cn(TH, "pl-4 @md:pl-5")}>Producto</th>
              <th className={cn(TH, "hidden text-right @md:table-cell")}>Cantidad</th>
              <th className={cn(TH, "hidden text-right @lg:table-cell")}>Precio</th>
              <th className={cn(TH, "hidden text-right @2xl:table-cell")}>Descuento</th>
              <th className={cn(TH, "pr-4 text-right @md:pr-5")}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => {
              const discounted = Number(l.discount) > 0;
              return (
                <tr key={l.id} className="h-[52px] border-t border-border text-[14px]">
                  <td className="w-full max-w-0 py-2.5 pl-4 pr-3 @md:pl-5">
                    {linkProducts ? (
                      <Link href={`/inventory/${l.product_id}`} className="block truncate font-medium text-text-primary hover:text-accent-text">
                        {l.product_name}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium text-text-primary">{l.product_name}</span>
                    )}
                    <p className="truncate text-[12.5px] text-text-muted">
                      <span className="font-mono">{l.sku}</span>
                      <span className="@md:hidden">
                        {" "}
                        · {units(l.quantity)} × {soles(l.unit_price)}
                      </span>
                      <span className="hidden @md:inline @lg:hidden"> · {soles(l.unit_price)} c/u</span>
                      {discounted && <span className="@2xl:hidden"> · descuento − {soles(l.discount)}</span>}
                    </p>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono @md:table-cell">{units(l.quantity)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-text-secondary @lg:table-cell">{soles(l.unit_price)}</td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-mono text-text-secondary @2xl:table-cell">
                    {discounted ? `− ${soles(l.discount)}` : "—"}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right font-mono text-text-primary @md:pr-5">{soles(l.line_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-border px-5 py-4">
        <TotalsList
          className="w-full max-w-xs"
          gross={gross}
          discount={order.discount_total}
          subtotal={order.subtotal}
          igv={order.igv}
          total={order.total}
        />
      </div>
    </Card>
  );
}
