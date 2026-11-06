import { units } from "@/lib/format";
import { stockApi } from "@/services/api/inventory";
import type { AdjustmentResult } from "@/types/inventory";

type Toast = (message: string, options?: { undo?: () => void }) => void;

/**
 * Announces an inventory adjustment and offers «Deshacer», which posts the opposite adjustment
 * (reason «otro»): both stay visible in the product's entradas y salidas.
 */
export function announceAdjustment(
  toast: Toast,
  companyId: string,
  productName: string,
  result: AdjustmentResult,
  reload: () => void,
) {
  if (result.delta === 0) {
    toast(`«${productName}»: ya tenías ${units(result.new_stock)}, no cambió nada.`);
    return;
  }
  toast(`«${productName}»: ahora tienes ${units(result.new_stock)} (antes ${units(result.previous_stock)}).`, {
    undo: () => {
      stockApi
        .adjust(companyId, {
          product_id: result.product_id,
          mode: "delta",
          quantity: -result.delta,
          reason: "otro",
          note: "Deshace el ajuste anterior",
        })
        .then(() => {
          reload();
          toast(`Deshiciste el ajuste: «${productName}» vuelve a ${units(result.previous_stock)}.`);
        })
        .catch((err: unknown) => toast(err instanceof Error ? err.message : "No se pudo deshacer el ajuste."));
    },
  });
}
