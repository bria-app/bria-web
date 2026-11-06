import { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ProductThumb } from "@/features/products/ProductThumb";
import { AlertBadges } from "@/features/custom-fields/AlertBadges";
import { alertFires, limaToday } from "@/features/custom-fields/rules";
import { fieldAppliesTo } from "@/features/custom-fields/scope";
import { formatCustomValue } from "@/features/custom-fields/values";
import { formatNumber, percent, soles, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { STOCK_STATUS_LABEL, type InventoryOverviewItem, type StockStatus } from "@/types/inventory";
import { STATUS_TONE, coverageText, marginPct, maybeNumber, unitLabel } from "./stockStatus";

type Row = InventoryOverviewItem;

export interface CatalogColumn {
  key: string;
  label: string;
  /** Where the column comes from, shown in the columns panel. */
  origin: "fija" | "sistema" | "propio";
  align?: "right";
  /** Fixed columns stay first and pinned while the rest scrolls. */
  fixed?: boolean;
  /** `fold` is what hidden columns would say, shown inside the pinned cells (see `foldedCells`). */
  cell: (r: Row, fold?: ReactNode) => ReactNode;
  sort: (r: Row) => number | string;
}

const STATUS_RANK: Record<StockStatus, number> = { sin_stock: 0, critico: 1, reordenar: 2, ok: 3 };
const n = (v: unknown) => Number(v ?? 0);
const mono = "font-mono text-[13px]";
const dash = <span className="text-text-muted">—</span>;

/** Built-in columns, in their default order. «product» and «stock» are fixed. */
export const BUILTIN_COLUMNS: CatalogColumn[] = [
  {
    key: "product",
    label: "Producto",
    origin: "fija",
    fixed: true,
    sort: (r) => r.name.toLowerCase(),
    cell: (r, fold) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden shrink-0 sm:block">
          <ProductThumb src={r.image_url} name={r.name} size="xs" />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link href={`/inventory/${r.id}`} onClick={(e) => e.stopPropagation()} className="block min-w-0 truncate font-semibold text-text-primary hover:underline">
              {r.name}
            </Link>
            {r.alerts && r.alerts.length > 0 && <AlertBadges alerts={r.alerts} withColumn={false} max={1} className="shrink-0 flex-nowrap" />}
          </div>
          <p className="truncate font-mono text-[12px] text-text-muted">
            {r.sku}
            {fold}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "stock",
    label: "Quedan",
    origin: "fija",
    fixed: true,
    align: "right",
    sort: (r) => r.stock_on_hand,
    cell: (r, fold) => (
      <>
        <span className={cn("font-mono text-[14px] font-semibold", r.stock_on_hand <= 0 ? "text-danger" : "text-text-primary")}>
          {formatNumber(r.stock_on_hand)} <span className="text-[12px] font-normal text-text-muted">{unitLabel(r.unit_of_measure)}</span>
        </span>
        {fold}
      </>
    ),
  },
  {
    key: "status",
    label: "Estado",
    origin: "sistema",
    sort: (r) => STATUS_RANK[r.status] * 1e9 + r.stock_on_hand,
    cell: (r) => (
      <span className="inline-flex flex-col items-start gap-0.5 2xl:flex-row 2xl:items-center 2xl:gap-1.5">
        <Badge tone={STATUS_TONE[r.status]}>{STOCK_STATUS_LABEL[r.status]}</Badge>
        {r.lost_sales_30d > 0 && (
          <span className="text-[12px] font-semibold text-danger" title="Veces que te pidieron este producto y no había, en los últimos 30 días">
            {r.lost_sales_30d} {r.lost_sales_30d === 1 ? "pedido perdido" : "pedidos perdidos"}
            <span className="sr-only"> en 30 días</span>
          </span>
        )}
      </span>
    ),
  },
  {
    key: "category",
    label: "Categoría",
    origin: "sistema",
    sort: (r) => r.category_path.join(" › ").toLowerCase(),
    cell: (r) =>
      r.category_path.length ? (
        <span className="block max-w-[200px] truncate text-text-secondary" title={r.category_path.join(" › ")}>
          {r.category_path.join(" › ")}
        </span>
      ) : (
        dash
      ),
  },
  { key: "price", label: "Precio", origin: "sistema", align: "right", sort: (r) => n(r.unit_price), cell: (r) => <span className={mono}>{soles(r.unit_price)}</span> },
  {
    key: "cost",
    label: "Costo",
    origin: "sistema",
    align: "right",
    sort: (r) => maybeNumber(r.unit_cost) ?? -Infinity,
    cell: (r) => (r.unit_cost == null ? dash : <span className={cn(mono, "text-text-secondary")}>{soles(r.unit_cost)}</span>),
  },
  {
    key: "margin",
    label: "Margen",
    origin: "sistema",
    align: "right",
    sort: (r) => marginPct(n(r.unit_price), maybeNumber(r.unit_cost)) ?? -Infinity,
    cell: (r) => {
      const m = marginPct(n(r.unit_price), maybeNumber(r.unit_cost));
      return m == null ? dash : <span className={cn(mono, m < 0 && "text-danger")}>{percent(m / 100)}</span>;
    },
  },
  {
    key: "coverage",
    label: "Te alcanza para",
    origin: "sistema",
    align: "right",
    sort: (r) => r.coverage_days ?? Number.POSITIVE_INFINITY,
    cell: (r) => {
      const text = coverageText(r.coverage_days);
      if (!text) return <span className="text-[13px] text-text-muted">Sin ventas</span>;
      return <span className={cn(mono, r.coverage_days != null && r.coverage_days < 7 && "font-semibold text-danger")}>{text}</span>;
    },
  },
  { key: "sold30", label: "Vendido en 30 días", origin: "sistema", align: "right", sort: (r) => r.units_sold_30d, cell: (r) => <span className={mono}>{formatNumber(r.units_sold_30d)}</span> },
  {
    key: "value",
    label: "Valor del inventario",
    origin: "sistema",
    align: "right",
    sort: (r) => maybeNumber(r.stock_value) ?? -Infinity,
    cell: (r) => (r.stock_value == null ? dash : <span className={mono}>{soles(r.stock_value)}</span>),
  },
  { key: "safety", label: "Inventario mínimo", origin: "sistema", align: "right", sort: (r) => r.safety_stock, cell: (r) => <span className={mono}>{formatNumber(r.safety_stock)}</span> },
  { key: "reorder", label: "Comprar al llegar a", origin: "sistema", align: "right", sort: (r) => r.reorder_point, cell: (r) => <span className={mono}>{formatNumber(r.reorder_point)}</span> },
  {
    key: "lead",
    label: "Demora del proveedor",
    origin: "sistema",
    align: "right",
    sort: (r) => r.lead_time_days,
    cell: (r) => (r.lead_time_days > 0 ? <span className={mono}>{r.lead_time_days} d</span> : dash),
  },
  { key: "barcode", label: "Código de barras", origin: "sistema", sort: (r) => r.barcode ?? "", cell: (r) => (r.barcode ? <span className={mono}>{r.barcode}</span> : dash) },
  {
    key: "last_movement",
    label: "Último movimiento",
    origin: "sistema",
    sort: (r) => r.last_movement_at ?? "",
    cell: (r) => (r.last_movement_at ? <span className="text-text-secondary">{timeAgo(r.last_movement_at)}</span> : <span className="text-text-muted">Nunca</span>),
  },
];

/**
 * From which width each turned-on column has room. The default set fits without scrolling
 * (main column ~335 px on a phone, ~470 at 768 with the sidebar, ~690 at 1024, ~930 at 1280);
 * phones get product, stock and price only. Columns turned on beyond the defaults show from
 * lg up and may scroll sideways, which is the point of a configurable sheet.
 */
const SHOW: Record<string, string> = {
  product: "",
  stock: "",
  price: "max-sm:pr-4",
  status: "hidden lg:table-cell",
  margin: "hidden lg:table-cell",
  coverage: "hidden xl:table-cell",
  category: "hidden 2xl:table-cell",
};
export const columnShow = (key: string) => SHOW[key] ?? "hidden lg:table-cell";

const TONE_TEXT: Record<BadgeTone, string> = {
  neutral: "text-text-muted",
  accent: "text-accent-text",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

/** While status, category or coverage are hidden by width, their value rides in the pinned cells. */
export function foldedCells(r: Row, shown: Set<string>): { product?: ReactNode; stock?: ReactNode } {
  const category = shown.has("category") && r.category_path.length > 0;
  const product =
    shown.has("status") || category ? (
      <>
        {shown.has("status") && <span className={cn("font-sans lg:hidden", TONE_TEXT[STATUS_TONE[r.status]])}> · {STOCK_STATUS_LABEL[r.status]}</span>}
        {category && <span className="font-sans 2xl:hidden"> · {r.category_path.join(" › ")}</span>}
      </>
    ) : undefined;
  const short = r.coverage_days != null && r.coverage_days < 7;
  const stock = shown.has("coverage") ? (
    <span className={cn("block text-[12px] xl:hidden", short ? "font-semibold text-danger" : "text-text-muted")}>{coverageText(r.coverage_days) ?? "Sin ventas"}</span>
  ) : undefined;
  return { product, stock };
}

/** Columns hidden until someone turns them on. */
export const DEFAULT_HIDDEN = ["cost", "sold30", "value", "safety", "reorder", "lead", "barcode", "last_movement"];

export const customKey = (field: CustomFieldDTO) => `custom:${field.key}`;

/** A column for one of the company's own product fields. */
export function customColumn(field: CustomFieldDTO, categories: CategoryDTO[]): CatalogColumn {
  const numeric = field.field_type === "number" || field.field_type === "currency";
  return {
    key: customKey(field),
    label: field.label,
    origin: "propio",
    align: numeric ? "right" : undefined,
    sort: (r) => {
      const v = r.custom_attributes?.[field.key];
      // Imported numbers may arrive as text: sort them as numbers, blanks last.
      if (numeric) {
        const x = v == null || v === "" ? NaN : Number(v);
        return Number.isFinite(x) ? x : Number.NEGATIVE_INFINITY;
      }
      return typeof v === "number" ? v : String(v ?? "").toLowerCase();
    },
    cell: (r) => {
      if (!fieldAppliesTo(field, r.category_id, categories)) return notApplicable;
      const value = r.custom_attributes?.[field.key];
      const alert = field.rules?.alert;
      const fired = alert && (r.alerts ? r.alerts.some((a) => a.key === field.key) : alertFires(field.field_type, alert, value, limaToday()));
      if (!fired) return <span className={cn("text-text-secondary", numeric && mono)}>{formatCustomValue(field, value)}</span>;
      // The value that raised the alert, in the alert's tone; its label is in the product cell.
      return (
        <span title={alert.label} className={cn("inline-flex items-center gap-1 font-semibold", alert.tone === "danger" ? "text-danger" : "text-warning", numeric && mono)}>
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {formatCustomValue(field, value)}
          <span className="sr-only"> · {alert.label}</span>
        </span>
      );
    },
  };
}

const notApplicable = (
  <span className="text-text-muted">
    ·<span className="sr-only">No aplica a esta categoría</span>
  </span>
);
