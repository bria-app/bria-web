import { inventoryApi } from "@/services/api/resources";
import { posApi } from "@/services/api/pos";
import { purchasingApi } from "@/services/api/purchasing";
import { soles, toDate, units } from "@/lib/format";
import type { MovementDTO } from "@/types/api";
import type { PurchaseDocumentDTO } from "@/types/purchasing";
import type { SalesOrderRow } from "@/types/pos";
import type { ActivityItem } from "./types";

/** Reference type the backend puts on inventory adjustments (`inventory/.../adjustment.py`). */
const ADJUSTMENT_REFERENCE = "adjustment";
const LIMIT = 7;

export interface ActivitySource {
  tickets: SalesOrderRow[];
  purchases: PurchaseDocumentDTO[];
  adjustments: MovementDTO[];
}

/** Latest till sales, purchase documents and inventory adjustments. */
export async function loadActivity(companyId: string): Promise<ActivitySource> {
  const [tickets, purchases, adjustments] = await Promise.all([
    posApi.list(companyId, { page: 1, size: LIMIT }),
    purchasingApi.documents(companyId, { page: 1, size: LIMIT }),
    // Only adjustments, filtered by the API: a busy day of sales no longer pushes them out of the page.
    inventoryApi.listMovements(companyId, { referenceType: ADJUSTMENT_REFERENCE, page: 1, size: LIMIT }),
  ]);
  return { tickets: tickets.items, purchases: purchases.items, adjustments };
}

const purchaseAt = (d: PurchaseDocumentDTO) => d.created_at ?? `${d.purchase_date}T12:00:00-05:00`;

/** One feed, newest first. `names` resolves product ids for adjustments. */
export function buildActivity(src: ActivitySource, names: Map<string, string>): ActivityItem[] {
  const sales = src.tickets.map<ActivityItem>((t) => ({
    id: `sale:${t.id}`,
    kind: t.status === "voided" ? "voided" : "sale",
    text: `${t.status === "voided" ? "Venta anulada" : "Venta"} · ${t.document_number}${t.seller_name ? ` · ${t.seller_name}` : ""}`,
    amount: soles(t.total),
    at: t.sold_at,
    href: `/sales/${t.id}`,
  }));
  const purchases = src.purchases.map<ActivityItem>((d) => ({
    id: `purchase:${d.document_id}`,
    kind: "purchase",
    text: `Compra a ${d.supplier_name} · ${units(d.units)}`,
    amount: soles(d.total),
    at: purchaseAt(d),
    href: "/purchases",
  }));
  const adjustments = src.adjustments.flatMap<ActivityItem>((m) => {
    const name = names.get(m.product_id);
    if (!name) return [];
    const signed = m.signed_quantity ?? (m.movement_type === "outbound" ? -m.quantity : m.quantity);
    const why = m.reason.replace(/^Ajuste · /, "");
    return [
      {
        id: `adj:${m.id}`,
        kind: "adjustment",
        text: `Ajuste · ${name}${why ? ` · ${why}` : ""}`,
        amount: `${signed > 0 ? "+" : "−"}${units(Math.abs(signed))}`,
        at: m.occurred_at,
        href: `/inventory/${m.product_id}`,
      },
    ];
  });
  return [...sales, ...purchases, ...adjustments]
    .sort((a, b) => toDate(b.at).getTime() - toDate(a.at).getTime())
    .slice(0, LIMIT);
}
