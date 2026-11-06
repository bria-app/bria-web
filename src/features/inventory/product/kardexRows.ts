import { formatNumber, soles } from "@/lib/format";
import type { TimelineEvent, TimelineKind } from "@/types/inventory";

export interface KardexRow {
  key: string;
  kind: TimelineKind;
  at: string;
  title: string;
  detail: string;
  document: string | null;
  href: string | null;
  /** Units in / out. Lost sales move nothing, so both are null. */
  entra: number | null;
  sale: number | null;
  /** An imported sale may be history only (it may not have taken units out). */
  imported: boolean;
}

const ADJUSTMENT_ORIGIN: Record<string, string> = {
  import: "Carga desde Excel",
  initial: "Inventario inicial del producto",
  sale_void: "Venta anulada: las unidades volvieron",
  adjustment: "Ajuste manual",
};

/** Turns a Product 360 event into one line of «Entradas y salidas». */
export function kardexRow(e: TimelineEvent): KardexRow {
  const base = { key: `${e.kind}-${e.id}`, kind: e.kind, at: e.occurred_at, imported: false };
  switch (e.kind) {
    case "sale": {
      const imported = !e.order_id && !!e.batch_id;
      return {
        ...base,
        imported,
        title: e.order_number ? "Venta" : imported ? "Venta importada" : "Venta",
        detail: [`${formatNumber(e.quantity)} × ${soles(e.unit_price)}`, e.seller_name].filter(Boolean).join(" · "),
        document: e.order_number != null ? `Venta #${e.order_number}` : null,
        href: e.order_id ? `/sales/${e.order_id}` : null,
        entra: null,
        sale: e.quantity,
      };
    }
    case "restock":
      return {
        ...base,
        title: `Compra · ${e.supplier_name ?? "Proveedor eliminado"}`,
        detail: `${formatNumber(e.quantity)} × ${e.unit_cost == null ? "—" : soles(e.unit_cost)}`,
        document: e.document_number,
        // The timeline outer-joins suppliers: no name means the supplier was deleted and has no page.
        href: e.supplier_id && e.supplier_name ? `/suppliers/${e.supplier_id}` : null,
        entra: e.quantity,
        sale: null,
      };
    case "adjustment": {
      const signed = e.signed_quantity ?? e.quantity;
      const origin = e.reference_type ? ADJUSTMENT_ORIGIN[e.reference_type] : undefined;
      return {
        ...base,
        title: e.reason ?? origin ?? (signed < 0 ? "Salida" : "Entrada"),
        detail: origin ?? (e.movement_type === "outbound" ? "Salida de inventario" : "Entrada de inventario"),
        document: null,
        href: null,
        entra: signed > 0 ? signed : null,
        sale: signed < 0 ? -signed : null,
      };
    }
    default:
      return {
        ...base,
        title: "Te pidieron y no había",
        detail: [
          `Pidieron ${formatNumber(e.requested_quantity ?? e.quantity)}, había ${formatNumber(e.available_quantity ?? 0)}`,
          e.seller_name,
        ]
          .filter(Boolean)
          .join(" · "),
        document: null,
        href: null,
        entra: null,
        sale: null,
      };
  }
}
