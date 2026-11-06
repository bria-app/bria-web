import type { SalesOrder } from "@/types/pos";

/**
 * Note the API puts on tickets built from imported history (`history_import.py`, affect_stock=False).
 * Those tickets never took units out, so voiding one gives nothing back. Bulk sales
 * («Carga masiva de ventas») did take stock and return it like a till sale.
 */
const HISTORY_NOTE = "Importación de ventas";

/** True for imported history: no stock was taken, so a void returns no units. */
export function tookNoStock(order: Pick<SalesOrder, "notes">): boolean {
  return order.notes.trim().startsWith(HISTORY_NOTE);
}
