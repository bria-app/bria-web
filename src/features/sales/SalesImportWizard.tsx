"use client";

import { useState } from "react";
import { PackageMinus } from "lucide-react";
import { SmartImportWizard, type ImportResult, type ImportRow } from "@/features/import/SmartImportWizard";
import type { ImportRequirementGroup, ImportTargetField } from "@/features/import/parse";
import { cn } from "@/lib/utils";
import { formatNumber, shortDate, soles, units } from "@/lib/format";
import { Switch } from "@/components/ui/Switch";
import { salesHistoryApi } from "@/services/api/pos";

const TARGETS: ImportTargetField[] = [
  { key: "sale_date", label: "Fecha", required: true, type: "date", question: "¿Qué columna es la fecha de venta?", constant: { label: "Todas son del mismo día" }, synonyms: ["fecha", "fecha de venta", "fecha venta", "fecha emisión", "fecha emision", "día", "dia", "date"] },
  { key: "code", label: "Código", synonyms: ["código", "codigo", "cod", "cód", "código producto", "codigo producto", "sku", "item", "ref"], hint: "Así encontramos el producto" },
  { key: "barcode", label: "Código de barras", synonyms: ["ean", "ean13", "código de barras", "codigo de barras", "cod barras", "cod barra", "barcode", "upc"] },
  { key: "name", label: "Producto", synonyms: ["producto", "descripción", "descripcion", "artículo", "articulo", "detalle", "nombre"], hint: "Si no hay código, se busca por nombre exacto" },
  { key: "quantity", label: "Cantidad", required: true, type: "integer", question: "¿Qué columna es la cantidad?", constant: { label: "Misma cantidad en todas" }, synonyms: ["cantidad", "cant", "cant.", "unidades", "qty", "und"] },
  { key: "unit_price", label: "Precio unitario", type: "number", synonyms: ["precio unitario", "p. unit", "p unit", "p.unit", "precio", "pvp", "valor unitario", "precio venta"], hint: "Si falta, usamos el precio del producto" },
  { key: "document_number", label: "Comprobante", synonyms: ["comprobante", "n° comprobante", "nro comprobante", "boleta", "factura", "ticket", "pedido", "n° pedido", "documento", "serie"], hint: "Las filas con el mismo comprobante forman una sola venta" },
  { key: "payment_method", label: "Medio de pago", synonyms: ["medio de pago", "forma de pago", "método de pago", "metodo de pago", "pago"] },
  { key: "client_name", label: "Cliente", synonyms: ["cliente", "razón social", "razon social", "nombre cliente"] },
  { key: "client_doc", label: "DNI / RUC del cliente", synonyms: ["dni/ruc", "dni ruc", "dni", "ruc", "doc cliente", "documento cliente", "doc. cliente"] },
  { key: "seller_name", label: "Vendedor", synonyms: ["vendedor", "cajero", "cajera", "atendido por", "usuario", "vendedora"] },
];

// Each row needs something that says which product it is.
const PRODUCT_GROUP: ImportRequirementGroup[] = [
  { id: "product", keys: ["name", "code", "barcode"], label: "Producto", hint: "el nombre, el código o el código de barras", question: "¿Qué columna dice qué producto es?" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  onFinished: () => void;
}

/**
 * Bulk sales from an Excel/CSV (one row per product sold). Rows sharing a comprobante become
 * one sale with its client, payment method and seller, so they show up in Ventas.
 * A visible switch decides whether the inventory is discounted (off by default: past sales).
 */
export function SalesImportWizard({ open, onClose, companyId, onFinished }: Props) {
  const [affectStock, setAffectStock] = useState(false);
  const close = () => {
    setAffectStock(false);
    onClose();
  };

  const onImport = async (rows: ImportRow[]): Promise<ImportResult> => {
    if (!companyId) throw new Error("No encontramos tu negocio. Vuelve a iniciar sesión.");
    const v = (r: ImportRow, k: string) => r.values[k] || undefined;
    const res = await salesHistoryApi.import(
      companyId,
      rows.map((r) => ({
        row: r.rowNumber,
        code: v(r, "code"),
        barcode: v(r, "barcode"),
        name: v(r, "name"),
        sale_date: r.values.sale_date ?? "",
        quantity: r.values.quantity ?? "",
        unit_price: v(r, "unit_price"),
        seller_name: v(r, "seller_name"),
        document_number: v(r, "document_number"),
        payment_method: v(r, "payment_method"),
        client_name: v(r, "client_name"),
        client_doc: v(r, "client_doc"),
      })),
      { affectStock },
    );
    const notes: string[] = [];
    if (res.created > 0) {
      notes.push(
        `${formatNumber(res.tickets)} ${res.tickets === 1 ? "venta" : "ventas"} · ${units(res.units)} · ${soles(res.revenue)}` +
          (res.period_start && res.period_end ? ` · del ${shortDate(`${res.period_start}T12:00:00`)} al ${shortDate(`${res.period_end}T12:00:00`)}` : ""),
      );
      notes.push("Ya aparecen en Ventas y en Hoy.");
      notes.push(affectStock ? "Se descontaron del inventario de cada producto." : "Tu inventario no cambió.");
      notes.push("Siguiente paso: abre Pronóstico y calcula cuánto venderás.");
    }
    return { created: res.created, errors: res.errors, notes };
  };

  return (
    <SmartImportWizard
      open={open}
      onClose={close}
      title="Importar ventas"
      entityLabel="ventas"
      targetFields={TARGETS}
      allowNewColumns={false}
      requireOneOf={PRODUCT_GROUP}
      onImport={onImport}
      onFinished={onFinished}
      uploadHint={
        <p>
          Sube tu Excel de ventas: una fila por cada producto vendido, con la <strong>fecha</strong>, la
          <strong> cantidad</strong> y el nombre o código del producto. Si tiene el número de <strong>boleta o factura</strong>,
          juntamos esas filas en una sola venta. Antes, asegúrate de haber cargado tus productos.
        </p>
      }
      mappingExtra={
        <div className={cn("flex h-full items-start gap-3 rounded-2xl border p-4", affectStock ? "border-warning bg-warning-soft" : "border-border bg-surface")}>
          <Switch checked={affectStock} onChange={setAffectStock} label="Descontar del inventario" />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <PackageMinus aria-hidden className="h-4 w-4 text-text-muted" /> Descontar del inventario
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">
              {affectStock
                ? "Cada venta resta unidades de tu inventario. Úsalo para ventas nuevas hechas fuera de la tienda. Si no alcanza el inventario, esa fila no se carga."
                : "Tu inventario no cambia. Es lo correcto para ventas pasadas: tu inventario actual ya las refleja."}
            </p>
          </div>
        </div>
      }
    />
  );
}

