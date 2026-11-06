import { formatNumber, units } from "@/lib/format";
import type { ErpSummary } from "@/types/forecasting";
import type { InventoryOverviewItem } from "@/types/inventory";
import type { RecommendationDTO, RecommendationPriority } from "@/types/api";
import type { TodoItem } from "./types";

const PRIORITY_RANK: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_PILL: Record<RecommendationPriority, Pick<TodoItem, "pill" | "tone">> = {
  high: { pill: "Urgente", tone: "danger" },
  medium: { pill: "Esta semana", tone: "warning" },
  low: { pill: "Sugerido", tone: "neutral" },
};

const purchaseHref = (productId: string, qty?: number) =>
  `/purchases/new?product=${productId}${qty ? `&cantidad=${qty}` : ""}`;

const leadNote = (p: InventoryOverviewItem) =>
  p.lead_time_days > 0 ? ` Tarda ${p.lead_time_days} ${p.lead_time_days === 1 ? "día" : "días"} en llegar.` : "";

function stockWhy(p: InventoryOverviewItem): string {
  if (p.status === "sin_stock") {
    const pace = p.units_sold_30d > 0 ? ` Vendiste ${units(p.units_sold_30d)} en 30 días.` : "";
    return `Se acabó.${pace}${leadNote(p)}`;
  }
  if (p.coverage_days != null) {
    const days = Math.max(0, Math.floor(p.coverage_days));
    const lasts = days === 0 ? "Se acaba hoy." : `Te alcanza para ${formatNumber(days)} ${days === 1 ? "día" : "días"}.`;
    return `${lasts}${leadNote(p)}`;
  }
  return `Quedan ${units(p.stock_on_hand)}; tu mínimo es ${units(p.safety_stock)}.${leadNote(p)}`;
}

/**
 * «Para hoy»: out-of-stock and critical products first, then pending purchase suggestions
 * whose product still needs restocking, then products that did not sell in 30 days.
 * Every item links to a real action (register a purchase or open the product).
 */
export function buildTodo(
  products: InventoryOverviewItem[],
  recs: RecommendationDTO[],
  summary: ErpSummary | null,
): TodoItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const recByProduct = new Map<string, RecommendationDTO>();
  for (const r of recs) {
    const prev = recByProduct.get(r.product_id);
    if (!prev || PRIORITY_RANK[r.priority] < PRIORITY_RANK[prev.priority]) recByProduct.set(r.product_id, r);
  }

  const urgent = products
    .filter((p) => p.status === "sin_stock" || p.status === "critico")
    .sort((a, b) => (a.status === b.status ? (a.coverage_days ?? 0) - (b.coverage_days ?? 0) : a.status === "sin_stock" ? -1 : 1))
    .map<TodoItem>((p) => {
      const qty = recByProduct.get(p.id)?.recommended_quantity;
      return {
        id: `stock:${p.id}`,
        pill: p.status === "sin_stock" ? "Agotado" : "Por acabarse",
        tone: p.status === "sin_stock" ? "danger" : "warning",
        title: qty ? `Pide ${units(qty)} de ${p.name}` : `Repón ${p.name}`,
        why: stockWhy(p),
        productHref: `/inventory/${p.id}`,
        cta: { label: "Registrar compra", href: purchaseHref(p.id, qty) },
      };
    });

  // A suggestion for a product that is already fine again is stale: leave it out.
  const suggested = [...recByProduct.values()]
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .flatMap<TodoItem>((r) => {
      const p = byId.get(r.product_id);
      if (!p || p.status !== "reordenar") return [];
      return [
        {
          id: `rec:${r.id}`,
          ...PRIORITY_PILL[r.priority],
          title: `Pide ${units(r.recommended_quantity)} de ${p.name}`,
          why: stockWhy(p),
          productHref: `/inventory/${p.id}`,
          cta: { label: "Registrar compra", href: purchaseHref(p.id, r.recommended_quantity) },
        },
      ];
    });

  const quiet = (summary?.bottom_products ?? [])
    .filter((p) => p.units === 0 && p.on_hand > 0)
    .slice(0, 2)
    .map<TodoItem>((p) => ({
      id: `quiet:${p.product_id}`,
      pill: "Quieto",
      tone: "neutral",
      title: `${p.name} no se vende`,
      why: `Sin ventas en 30 días y tienes ${units(p.on_hand)} en tienda. No compres más por ahora.`,
      productHref: `/inventory/${p.product_id}`,
      cta: { label: "Ver producto", href: `/inventory/${p.product_id}` },
    }));

  return [...urgent, ...suggested, ...quiet];
}
