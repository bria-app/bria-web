import Link from "next/link";
import { ArrowLeft, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertBadges } from "@/features/custom-fields/AlertBadges";
import { ProductThumb } from "@/features/products/ProductThumb";
import type { ProductDTO } from "@/types/api";
import { STOCK_STATUS_LABEL, type StockStatus } from "@/types/inventory";
import { STATUS_TONE } from "@/features/inventory/stockStatus";

interface ProductHeaderProps {
  product: ProductDTO;
  categoryPath: string[];
  status: StockStatus;
  onAdjust: () => void;
}

/** Back link, photo, name, SKU, status and own-column alerts, plus the two actions that move units. */
export function ProductHeader({ product, categoryPath, status, onAdjust }: ProductHeaderProps) {
  return (
    <div className="space-y-4">
      <Link href="/inventory" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Inventario
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        <ProductThumb src={product.image_url} name={product.name} size="lg" />
        <div className="min-w-0 flex-1 basis-[200px] space-y-2">
          <h1 className="break-words font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[status]}>{STOCK_STATUS_LABEL[status]}</Badge>
            {!product.is_active && <Badge>Pausado</Badge>}
            <Badge className="font-mono font-semibold">{product.sku}</Badge>
            <span className="text-[13px] text-text-muted">{categoryPath.length ? categoryPath.join(" › ") : "Sin categoría"}</span>
          </div>
          {product.alerts && product.alerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Alertas de tus columnas">
              <AlertBadges alerts={product.alerts} size="md" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* The purchase starts with this product on its first line. */}
          <Link href={`/purchases/new?product=${product.id}`} className="btn btn-secondary h-11 gap-2 px-4 text-sm">
            <ShoppingCart aria-hidden className="h-4 w-4" /> Registrar compra
          </Link>
          <Button variant="strong" onClick={onAdjust}>
            <SlidersHorizontal aria-hidden className="h-4 w-4" /> Ajustar inventario
          </Button>
        </div>
      </div>
    </div>
  );
}
