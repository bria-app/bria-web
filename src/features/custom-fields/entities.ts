import type { CustomFieldEntity } from "@/types/custom-fields";

/**
 * Entities whose custom values the backend can store (`custom_attributes` exists only on
 * products and suppliers). Purchase and sale definitions could be created but their values
 * would have nowhere to live, so they are not offered.
 */
export type StorableEntity = Extract<CustomFieldEntity, "product" | "supplier">;

export const ENTITY_LABEL: Record<StorableEntity, { plural: string; one: string; where: string }> = {
  product: { plural: "Productos", one: "producto", where: "la ficha de cada producto y como columna del inventario" },
  supplier: { plural: "Proveedores", one: "proveedor", where: "la ficha de cada proveedor y como columna de la lista" },
};

export const isStorableEntity = (e: CustomFieldEntity): e is StorableEntity => e === "product" || e === "supplier";
