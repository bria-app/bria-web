import type { InventoryOverviewItem } from "@/types/inventory";
import { toDate } from "@/lib/format";

export type CatalogFilter = "todos" | "reponer" | "agotados" | "quietos" | "alertas" | "pausados";

const QUIET_DAYS = 90;
const DAY_MS = 86_400_000;

export const FILTERS: { id: CatalogFilter; label: string; help: string }[] = [
  { id: "todos", label: "Todos", help: "Todos tus productos a la venta." },
  { id: "reponer", label: "Por reponer", help: "Se acabaron, están por acabarse o no te alcanzan para lo que tarda tu proveedor." },
  { id: "agotados", label: "Agotados", help: "Productos que se acabaron: quedan 0." },
  { id: "quietos", label: "Sin movimiento", help: `Te quedan unidades, pero no entró ni salió nada en ${QUIET_DAYS} días.` },
  { id: "alertas", label: "Con alertas", help: "Productos con un aviso de tus columnas: por vencer, sin dato, fuera de rango…" },
  { id: "pausados", label: "Pausados", help: "Productos que pusiste en pausa (ya no los vendes)." },
];

/**
 * Whether a row belongs to a filter. Every rule reads real overview fields; «now» is the
 * overview's own `generated_at`, so the result does not depend on the browser clock.
 */
export function matchesFilter(r: InventoryOverviewItem, filter: CatalogFilter, nowIso: string): boolean {
  if (filter === "pausados") return !r.is_active;
  if (!r.is_active) return false;
  switch (filter) {
    case "reponer":
      return r.status !== "ok";
    case "agotados":
      return r.stock_on_hand <= 0;
    case "quietos": {
      if (r.stock_on_hand <= 0) return false;
      if (!r.last_movement_at) return true;
      return toDate(nowIso).getTime() - toDate(r.last_movement_at).getTime() > QUIET_DAYS * DAY_MS;
    }
    case "alertas":
      return (r.alerts?.length ?? 0) > 0;
    default:
      return true;
  }
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function matchesQuery(r: InventoryOverviewItem, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize([r.name, r.sku, r.barcode ?? "", r.category_path.join(" ")].join(" ")).includes(q);
}
