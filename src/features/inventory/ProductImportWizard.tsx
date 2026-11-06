"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { SmartImportWizard, type AppliedFills, type ImportResult, type ImportRow, type ImportTargetField, type NewCustomColumn } from "@/features/import/SmartImportWizard";
import { ensureNewColumns, newColumnsNote } from "@/features/import/newColumns";
import { catalogApi } from "@/services/api/inventory";
import type { CustomFieldDTO } from "@/types/custom-fields";
import type { ProductImportResult, ProductImportRow } from "@/types/inventory";
import { useProductDefaults } from "@/features/products/productDefaults";
import { normalizeUnit } from "@/features/products/productForm";

const BUILTIN_TARGETS: ImportTargetField[] = [
  { key: "sku", label: "Código", synonyms: ["código", "codigo", "cod", "cód", "codigo producto", "código producto", "cod producto", "item", "sku", "ref", "referencia"], hint: "Si falta, se genera P-000123" },
  { key: "barcode", label: "Código de barras", synonyms: ["ean", "ean13", "código de barras", "codigo de barras", "cod barra", "cod barras", "codbarra", "barcode", "upc", "gtin"] },
  { key: "name", label: "Nombre", required: true, question: "¿Qué columna es el nombre del producto?", synonyms: ["producto", "nombre", "descripción", "descripcion", "artículo", "articulo", "nombre producto", "detalle"] },
  { key: "category", label: "Categoría", synonyms: ["categoría", "categoria", "familia", "línea", "linea", "rubro", "marca", "grupo"], hint: "Usa «Marca > Tipo» para dos niveles" },
  { key: "unit_cost", label: "Costo (lo que te cuesta)", type: "number", synonyms: ["costo", "costo unitario", "p. compra", "p compra", "precio compra", "precio de compra", "cost", "costo promedio"] },
  { key: "unit_price", label: "Precio de venta", required: true, type: "number", question: "¿Qué columna es el precio de venta?", synonyms: ["precio", "pvp", "precio venta", "precio de venta", "p. venta", "p venta", "price"] },
  { key: "initial_stock", label: "Inventario", type: "integer", synonyms: ["stock", "cantidad", "existencia", "existencias", "saldo", "unidades", "stock actual", "cant"] },
  { key: "safety_stock", label: "Inventario mínimo", type: "integer", synonyms: ["stock mínimo de seguridad", "stock de seguridad", "stock seguridad", "stock minimo", "stock mínimo", "minimo", "mínimo"] },
  { key: "reorder_point", label: "Comprar al llegar a", type: "integer", synonyms: ["comprar cuando queden", "comprar al llegar a", "punto de reorden", "punto reorden", "reorden", "punto de pedido"] },
  { key: "lead_time_days", label: "Días que tarda el proveedor", type: "integer", synonyms: ["días que tarda el proveedor", "dias que tarda el proveedor", "días de reposición", "lead time", "tiempo de reposición", "tiempo reposicion", "dias reposicion", "días de entrega"] },
  { key: "unit_of_measure", label: "Unidad", synonyms: ["unidad", "um", "u.m.", "unidad de medida", "medida"] },
];

const TEMPLATE_HEADER = ["Código", "Código de barras", "Producto", "Categoría", "Costo", "Precio venta", "Inventario", "Inventario mínimo", "Comprar al llegar a", "Unidad"];
const TEMPLATE_ROWS = [
  ["PH-001", "7750000000011", "Alimento Premium Perro Adulto 15kg", "Pro Plan > Alimento seco", "185.50", "239.90", "12", "3", "6", "unidad"],
  ["", "7750000000028", "Arena Sanitaria Gato 10kg", "Cat Chow > Higiene", "32.00", "45.90", "20", "5", "8", "bolsa"],
];

// The API's message for a new product without a price (products/application/use_cases/importing.py).
const EMPTY_PRICE = /precio de venta está vacío/i;

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** An example value for an own field, so the template shows how to fill it. */
function sampleValue(f: CustomFieldDTO): string {
  switch (f.field_type) {
    case "select":
      return f.options[0] ?? "";
    case "boolean":
      return "Sí";
    case "number":
      return "1";
    case "currency":
      return "10.00";
    case "date":
      return "2026-12-31";
    default:
      return "";
  }
}

/** The example CSV: built-in columns plus every own product field, so Excel and bria match. */
function templateCsv(fields: CustomFieldDTO[]): string {
  const header = [...TEMPLATE_HEADER, ...fields.map((f) => f.label)];
  const rows = TEMPLATE_ROWS.map((row, i) => [...row, ...fields.map((f) => (i === 0 ? sampleValue(f) : ""))]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  fields: CustomFieldDTO[];
  onFinished: () => void;
}

export function ProductImportWizard({ open, onClose, companyId, fields, onFinished }: Props) {
  const [updateExisting, setUpdateExisting] = useState(true);
  const defaults = useProductDefaults(companyId);

  const targetFields = useMemo<ImportTargetField[]>(
    () => [
      // With no price column: one price for every row, or new products at S/ 0.00 for later.
      ...BUILTIN_TARGETS.map((t) =>
        t.key !== "unit_price"
          ? t
          : {
              ...t,
              constant: {
                label: "Mismo precio para todos (S/)",
                hint: updateExisting ? "También cambia el precio de los productos que ya tienes." : undefined,
              },
              later: {
                label: "Ponerlo después",
                hint: updateExisting
                  ? "Los productos nuevos quedan en S/ 0.00 hasta que les pongas precio; los que ya tienes mantienen el suyo."
                  : "Los productos nuevos quedan en S/ 0.00 hasta que les pongas precio.",
              },
            },
      ),
      ...fields.map((f) => ({
        key: `custom:${f.key}`,
        label: f.label,
        synonyms: [f.label, f.key],
        type: f.field_type === "number" || f.field_type === "currency" ? ("number" as const) : f.field_type === "date" ? ("date" as const) : ("text" as const),
      })),
    ],
    [fields, updateExisting],
  );

  const onImport = async (rows: ImportRow[], newColumns: NewCustomColumn[], fills: AppliedFills): Promise<ImportResult> => {
    if (!companyId) throw new Error("Tu sesión se cerró. Vuelve a entrar e inténtalo de nuevo.");
    const savedKeys = await ensureNewColumns(companyId, "product", newColumns);
    const toPayload = (list: ImportRow[], price?: string): ProductImportRow[] => list.map((r) => {
      const v = r.values;
      return {
        row: r.rowNumber,
        // Rows without a code take the barcode as code when that is the shop's rule (Configuración → Negocio).
        sku: v.sku || (defaults.value.barcode_as_sku && v.barcode ? v.barcode : undefined),
        barcode: v.barcode,
        name: v.name ?? "",
        category: v.category,
        unit_cost: v.unit_cost,
        unit_price: price ?? v.unit_price,
        initial_stock: v.initial_stock,
        safety_stock: v.safety_stock,
        reorder_point: v.reorder_point,
        lead_time_days: v.lead_time_days,
        // «Unidades» or «KG» become the units the product form offers, so the sheet shows them right.
        unit_of_measure: normalizeUnit(v.unit_of_measure),
        custom_attributes: savedKeys(r.custom),
      };
    });

    let res: ProductImportResult;
    let pricedLater = 0;
    if (fills.unit_price?.mode !== "later") {
      res = await catalogApi.import(companyId, toPayload(rows), updateExisting);
    } else if (!updateExisting) {
      res = await catalogApi.import(companyId, toPayload(rows, "0"), false);
      pricedLater = res.created;
    } else {
      // «Ponerlo después» while updating: a first pass without price updates the products that
      // exist (they keep their price); the new ones come back as «sin precio» and go in at S/ 0.00.
      const first = await catalogApi.import(companyId, toPayload(rows), true);
      const pending = new Set(first.errors.filter((e) => EMPTY_PRICE.test(e.message)).map((e) => e.row));
      if (pending.size === 0) res = first;
      else {
        const second = await catalogApi.import(companyId, toPayload(rows.filter((r) => pending.has(r.rowNumber)), "0"), true);
        pricedLater = second.created;
        res = {
          created: first.created + second.created,
          updated: first.updated + second.updated,
          categories_created: first.categories_created + second.categories_created,
          errors: [...first.errors.filter((e) => !pending.has(e.row)), ...second.errors].sort((a, b) => a.row - b.row),
        };
      }
    }
    const notes = [
      pricedLater === 0 ? null : pricedLater === 1 ? "1 producto quedó en S/ 0.00: ponle precio en Inventario." : `${pricedLater} productos quedaron en S/ 0.00: ponles precio en Inventario.`,
      res.categories_created === 0 ? null : res.categories_created === 1 ? "Se creó 1 categoría nueva." : `Se crearon ${res.categories_created} categorías nuevas.`,
      newColumnsNote(newColumns.length, "productos"),
    ].filter((n): n is string => n !== null);
    return { created: res.created, updated: res.updated, errors: res.errors, notes };
  };

  const downloadTemplate = () => {
    const blob = new Blob(["﻿" + templateCsv(fields)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SmartImportWizard
      open={open}
      onClose={onClose}
      title="Importar productos"
      entityLabel="productos"
      targetFields={targetFields}
      allowNewColumns
      onImport={onImport}
      onFinished={onFinished}
      uploadHint={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Solo necesitas el nombre y el precio de cada producto; lo demás es opcional. Si un producto no tiene código, le
            ponemos uno. Escribe la categoría como «Marca &gt; Tipo» para crear dos niveles.
            {fields.length > 0 && ` La plantilla trae también ${fields.length === 1 ? "tu dato propio" : `tus ${fields.length} datos propios`}.`}
          </p>
          <Button size="sm" variant="secondary" onClick={downloadTemplate} className="shrink-0">
            <Download aria-hidden className="h-3.5 w-3.5" /> Descargar plantilla
          </Button>
        </div>
      }
      mappingExtra={
        <div className="h-full space-y-1.5 rounded-2xl border border-border bg-surface p-4">
          <Switch showLabel label="Actualizar los productos que ya tengo" checked={updateExisting} onChange={setUpdateExisting} />
          <p className="text-[12.5px] text-text-muted">
            {updateExisting
              ? "Si el código o el código de barras ya existe, ese producto toma los datos de tu archivo. Sus unidades se toman como un conteo: la diferencia queda en sus entradas y salidas."
              : "Los productos que ya existen no se tocan: esas filas se saltan y te diremos cuáles fueron."}
          </p>
        </div>
      }
    />
  );
}
