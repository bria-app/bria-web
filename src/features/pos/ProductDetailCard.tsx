import { unitLabel } from "@/features/inventory/stockStatus";
import { ProductThumb } from "@/features/products/ProductThumb";
import { soles } from "@/lib/format";
import type { CatalogProduct } from "@/types/pos";
import { StockBadge } from "./StockBadge";

function formatAttr(v: string | number | boolean | null): string {
  if (v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

/** Read-only product facts for the inventory lookup: price, units left and attributes, never costs. */
export function ProductDetailCard({ product, fieldLabels }: { product: CatalogProduct; fieldLabels: Record<string, string> }) {
  const attrs = Object.entries(product.custom_attributes ?? {}).filter(([, v]) => v !== null && v !== "");
  const facts: [string, string, boolean][] = [
    ["Código (SKU)", product.sku, true],
    ["Código de barras", product.barcode || "—", true],
    ["Categoría", product.category_name || "Sin categoría", false],
    // «unit», «und», «u»… all read «Unidad»; other measures (kg, caja) as typed.
    ["Unidad", unitLabel(product.unit_of_measure) === "u" ? "Unidad" : product.unit_of_measure, false],
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <ProductThumb src={product.image_url} name={product.name} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {product.description && <p className="text-[14px] text-text-secondary">{product.description}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[26px] text-text-primary">{soles(product.unit_price)}</span>
            <StockBadge stock={product.stock_on_hand} reorderPoint={product.reorder_point} />
          </div>
          <span className="text-[12.5px] text-text-muted">Precio con IGV</span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[14px]">
        {facts.map(([label, value, mono]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[12px] font-semibold text-text-muted">{label}</dt>
            <dd className={mono ? "truncate font-mono text-text-primary" : "truncate text-text-primary"}>{value}</dd>
          </div>
        ))}
      </dl>

      {attrs.length > 0 && (
        <dl className="flex flex-wrap gap-2 border-t border-border pt-4">
          {attrs.map(([key, value]) => (
            <div key={key} className="flex gap-1.5 rounded-lg bg-surface-soft px-2.5 py-1 text-[13px]">
              <dt className="text-text-muted">{fieldLabels[key] ?? key}:</dt>
              <dd className="font-medium text-text-primary">{formatAttr(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
