import type { ImportTargetField } from "@/features/import/SmartImportWizard";
import type { CustomFieldDTO } from "@/types/custom-fields";

/** Columns the purchases spreadsheet can map to (plus the company's product columns). */
const BASE_TARGETS: ImportTargetField[] = [
  { key: "code", label: "Código", synonyms: ["codigo", "cod", "sku", "item", "codigo producto", "cod producto", "codigo interno", "cod item"], hint: "El código de tu producto" },
  { key: "barcode", label: "Código de barras", synonyms: ["ean", "ean13", "codigo de barras", "cod barras", "upc", "barcode"] },
  { key: "name", label: "Producto", synonyms: ["producto", "descripcion", "articulo", "nombre", "detalle", "nombre producto", "descripcion producto"] },
  { key: "quantity", label: "Cantidad", required: true, type: "integer", synonyms: ["cantidad", "cant", "unidades", "qty", "und", "unid"] },
  { key: "unit_cost", label: "Costo c/u", required: true, type: "number", synonyms: ["costo", "costo unitario", "precio compra", "p unit", "valor unitario", "precio unitario", "costo unit", "pu"] },
  { key: "unit_price", label: "Precio de venta", type: "number", synonyms: ["precio venta", "pvp", "precio de venta", "precio publico", "p venta"] },
  { key: "purchase_date", label: "Fecha", type: "date", synonyms: ["fecha", "fecha emision", "fecha de emision", "fecha compra"] },
  { key: "document_number", label: "N.º de factura o boleta", synonyms: ["factura", "comprobante", "documento", "n doc", "nro doc", "numero documento", "serie numero", "n factura"] },
];

export function purchaseImportTargets(productFields: CustomFieldDTO[]): ImportTargetField[] {
  return [...BASE_TARGETS, ...productFields.map((f) => ({ key: `custom:${f.key}`, label: f.label, synonyms: [f.label, f.key] }))];
}
