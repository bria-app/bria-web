"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CardGrid } from "@/components/ui/CardGrid";
import { ListStatus } from "@/components/ui/ListStatus";
import { AlertBadges } from "@/features/custom-fields/AlertBadges";
import { ProductThumb } from "@/features/products/ProductThumb";
import { formatNumber, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STOCK_STATUS_LABEL, type InventoryOverviewItem } from "@/types/inventory";
import { STATUS_TONE, coverageText, unitLabel } from "./stockStatus";

interface CatalogBoardProps {
  rows: InventoryOverviewItem[];
  /** Price and «te alcanza para» follow the columns the table shows. */
  showPrice: boolean;
  showCoverage: boolean;
  footer: React.ReactNode;
  emptyMessage: string;
}

/**
 * The inventory as cards. Same rows, same order as
 * the table; own-column alerts (`r.alerts`) show under the name with their column.
 */
export function CatalogBoard({ rows, showPrice, showCoverage, footer, emptyMessage }: CatalogBoardProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <CardGrid
          items={rows}
          getKey={(r) => r.id}
          label="Productos"
          minCard={272}
          renderCard={(r) => <CatalogCard r={r} showPrice={showPrice} showCoverage={showCoverage} />}
        />
      )}
      <ListStatus variant="cards">{footer}</ListStatus>
    </div>
  );
}

function CatalogCard({ r, showPrice, showCoverage }: { r: InventoryOverviewItem; showPrice: boolean; showCoverage: boolean }) {
  const coverage = coverageText(r.coverage_days);
  const short = r.coverage_days != null && r.coverage_days < 7;
  return (
    <Link
      href={`/inventory/${r.id}`}
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text-muted/40",
        !r.is_active && "text-text-muted",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ProductThumb src={r.image_url} name={r.name} size="sm" />
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", r.is_active ? "text-text-primary" : "text-text-muted")}>{r.name}</p>
          <p className="truncate text-[12px] text-text-muted">
            <span className="font-mono">{r.sku}</span>
            {r.lost_sales_30d > 0 && (
              <span className="font-semibold text-danger" title="Veces que te pidieron este producto y no había, en los últimos 30 días">
                {" · "}
                {r.lost_sales_30d} {r.lost_sales_30d === 1 ? "pedido perdido" : "pedidos perdidos"}
              </span>
            )}
          </p>
        </div>
      </div>

      {r.alerts && r.alerts.length > 0 && <AlertBadges alerts={r.alerts} max={2} />}

      <dl className="mt-auto grid grid-cols-2 gap-2">
        <div>
          <dt className="text-[11.5px] text-text-muted">Quedan</dt>
          <dd className={cn("font-mono text-[15px] font-semibold", r.stock_on_hand <= 0 ? "text-danger" : "text-text-primary")}>
            {formatNumber(r.stock_on_hand)} <span className="text-[12px] font-normal text-text-muted">{unitLabel(r.unit_of_measure)}</span>
          </dd>
        </div>
        {showCoverage && (
          <div className="text-right">
            <dt className="text-[11.5px] text-text-muted">Te alcanza para</dt>
            <dd className={cn("text-[14px]", short ? "font-semibold text-danger" : "text-text-secondary", coverage && "font-mono")}>{coverage ?? "Sin ventas"}</dd>
          </div>
        )}
      </dl>

      <div className="flex min-w-0 items-center justify-between gap-2">
        <Badge tone={STATUS_TONE[r.status]}>{STOCK_STATUS_LABEL[r.status]}</Badge>
        {showPrice && (
          <span className="min-w-0 truncate text-right">
            <span className="text-[11.5px] text-text-muted">Precio </span>
            <span className="font-mono text-[14px] font-semibold text-text-primary">{soles(r.unit_price)}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
