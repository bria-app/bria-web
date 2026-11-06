import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { BuiltinColumn } from "@/features/custom-fields/ColumnsManager";
import { soles } from "@/lib/format";
import type { SupplierDTO } from "@/types/api";
import { dayLabel, num } from "@/features/purchases/format";

/** Built-in columns of the suppliers table. Keys match the saved `columns:supplier` preference. */
export const SUPPLIER_COLUMNS: BuiltinColumn[] = [
  { key: "business_name", label: "Proveedor", locked: true },
  { key: "ruc", label: "RUC" },
  { key: "contact_name", label: "Contacto" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Correo" },
  { key: "address", label: "Dirección" },
  { key: "status", label: "Estado" },
  { key: "total_purchased", label: "Total comprado" },
  { key: "last_purchase_date", label: "Última compra" },
];

export const RIGHT_ALIGNED = new Set(["total_purchased"]);

/**
 * From which width each built-in column has room (the main column measures ~335 px on a phone,
 * ~470 px at 768 with the sidebar, ~690 px at 1024 and ~930 px at 1280). Unlisted keys always show.
 * While a column is hidden, its key data rides in the supplier cell (see `SupplierFolded`).
 */
const SUPPLIER_COLUMN_CLASS: Record<string, string> = {
  status: "hidden sm:table-cell",
  ruc: "hidden lg:table-cell",
  last_purchase_date: "hidden lg:table-cell",
  contact_name: "hidden xl:table-cell",
  phone: "hidden xl:table-cell",
  email: "hidden 2xl:table-cell",
  address: "hidden min-[1680px]:table-cell",
};

/** Text cells that wrap or truncate; everything else stays on one line. */
const NOWRAP = new Set(["ruc", "phone", "status", "total_purchased", "last_purchase_date"]);
export const supplierCellClass = (key: string) => [SUPPLIER_COLUMN_CLASS[key] ?? "", NOWRAP.has(key) ? "whitespace-nowrap" : ""].join(" ");

const Muted = ({ v, mono }: { v: string; mono?: boolean }) =>
  v ? <span className={mono ? "font-mono text-text-secondary" : "text-text-secondary"}>{v}</span> : <span className="text-text-muted">—</span>;

const Clip = ({ v, max }: { v: string; max: string }) =>
  v ? (
    <span className={`block truncate text-text-secondary ${max}`} title={v}>
      {v}
    </span>
  ) : (
    <span className="text-text-muted">—</span>
  );

export function supplierCell(key: string, s: SupplierDTO) {
  switch (key) {
    case "business_name":
      return (
        <Link href={`/suppliers/${s.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold text-text-primary hover:text-accent-text">
          {s.business_name}
        </Link>
      );
    case "ruc":
      return <span className="font-mono text-text-secondary">{s.ruc}</span>;
    case "contact_name":
      return <Clip v={s.contact_name} max="max-w-[140px]" />;
    case "phone":
      return <Muted v={s.phone} mono />;
    case "email":
      return <Clip v={s.email} max="max-w-[180px]" />;
    case "address":
      return <Clip v={s.address} max="max-w-[200px]" />;
    case "status":
      return <Badge tone={s.is_active ? "success" : "neutral"}>{s.is_active ? "Activo" : "Inactivo"}</Badge>;
    case "total_purchased":
      return num(s.total_purchased) > 0 ? <span className="font-mono">{soles(s.total_purchased)}</span> : <span className="text-text-muted">—</span>;
    case "last_purchase_date":
      return <Muted v={s.last_purchase_date ? dayLabel(s.last_purchase_date) : ""} />;
    default:
      return null;
  }
}

/** Muted line under the supplier's name with what its hidden columns would say. */
export function SupplierFolded({ s, shown }: { s: SupplierDTO; shown: Set<string> }) {
  const contact = [shown.has("contact_name") ? s.contact_name : "", shown.has("phone") ? s.phone : ""].filter(Boolean).join(" · ");
  const ruc = shown.has("ruc") && s.ruc;
  const inactive = shown.has("status") && !s.is_active;
  if (!ruc && !contact && !inactive) return null;
  return (
    <span className="block truncate text-[12.5px] text-text-muted xl:hidden">
      {inactive && <span className="sm:hidden">Inactivo{ruc || contact ? " · " : ""}</span>}
      {ruc && <span className="font-mono lg:hidden">RUC {s.ruc}</span>}
      {ruc && contact && <span className="lg:hidden"> · </span>}
      {contact}
    </span>
  );
}
