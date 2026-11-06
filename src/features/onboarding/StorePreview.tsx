import { Store, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BusinessType } from "./businesses";

interface StorePreviewProps {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  business: BusinessType | null;
  businessLabel: string | null;
  categories: string[];
  fields: string[];
  products: number | null;
  hasSales: boolean | null;
  team: number;
}

/** What has been set up so far, drawn from saved data (and the store form while typing). */
export function StorePreview(p: StorePreviewProps) {
  const Icon: LucideIcon = p.business?.icon ?? Store;

  return (
    <aside aria-label="Vista previa de tu tienda" className="flex flex-col gap-4">
      <p className="text-[13px] font-semibold text-text-secondary">Así va tu tienda</p>

      <div className="relative rounded-2xl border border-border bg-surface px-5 pb-6 pt-5 font-mono text-[11.5px] leading-[1.55] text-text-primary shadow-soft">
        <div className="text-center">
          <p className="font-display text-[17px] font-bold">{p.name || "Tu tienda"}</p>
          <p>RUC {p.taxId}</p>
          <p className={cn(!p.address && "text-text-muted")}>{p.address || "Tu dirección"}</p>
          <p className={cn(!p.phone && "text-text-muted")}>Tel. {p.phone || "tu teléfono"}</p>
        </div>
        <Dashed />
        <p className="text-center font-bold">BOLETA DE VENTA ELECTRÓNICA</p>
        <Dashed />
        <div aria-hidden className="flex flex-col gap-1.5 py-1">
          <span className="h-2 w-3/4 rounded-full bg-surface-muted" />
          <span className="h-2 w-1/2 rounded-full bg-surface-muted" />
          <span className="h-2 w-2/3 rounded-full bg-surface-muted" />
        </div>
        <p className="mt-1 text-center text-text-muted">Aquí irá cada venta</p>
        <span aria-hidden className="absolute inset-x-4 -bottom-px h-px border-b border-dashed border-border" />
      </div>

      <dl className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-[13px]">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-strong text-accent-on-strong">
            <Icon aria-hidden className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <dt className="text-text-muted">Rubro</dt>
            <dd className="truncate font-semibold text-text-primary">{p.businessLabel || "Sin elegir"}</dd>
          </div>
        </div>
        <Row label="Tipos de producto" items={p.categories} empty="Ninguno todavía" />
        <Row label="Columnas extra" items={p.fields} empty="Ninguna todavía" />
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
          <Stat label="Productos" value={p.products == null ? "…" : formatNumber(p.products)} />
          <Stat label="Ventas pasadas" value={p.hasSales == null ? "…" : p.hasSales ? "Sí" : "No"} />
          <Stat label="Equipo" value={formatNumber(p.team + 1)} />
        </div>
      </dl>
    </aside>
  );
}

function Dashed() {
  return <div aria-hidden className="my-2.5 border-t border-dashed border-border" />;
}

function Row({ label, items: all, empty }: { label: string; items: string[]; empty: string }) {
  // Subcategories can repeat a name under different parents («Alimento» for dogs and cats).
  const items = [...new Set(all)];
  const shown = items.slice(0, 6);
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-text-muted">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">
        {shown.length === 0 && <span className="text-text-muted">{empty}</span>}
        {shown.map((item) => (
          <span key={item} className="pop-in rounded-full bg-surface-muted px-2.5 py-0.5 text-[12px] font-medium text-text-secondary">
            {item}
          </span>
        ))}
        {items.length > shown.length && <span className="px-1 text-[12px] text-text-muted">+{items.length - shown.length}</span>}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    // Term first for the description list; drawn with the figure on top.
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="truncate text-[11.5px] text-text-muted">{label}</dt>
      <dd className="font-mono text-[18px] font-medium text-text-primary">{value}</dd>
    </div>
  );
}
