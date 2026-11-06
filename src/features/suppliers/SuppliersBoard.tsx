"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CardGrid } from "@/components/ui/CardGrid";
import { ListStatus } from "@/components/ui/ListStatus";
import { dayLabel, num } from "@/features/purchases/format";
import { soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SupplierDTO } from "@/types/api";
import { initials } from "./initials";

/** Suppliers as cards. A card opens the supplier's page. */
export function SuppliersBoard({ rows, footer }: { rows: SupplierDTO[]; footer: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <CardGrid items={rows} getKey={(s) => s.id} label="Proveedores" minCard={272} renderCard={(s) => <SupplierCard s={s} />} />
      <ListStatus variant="cards">{footer}</ListStatus>
    </div>
  );
}

function SupplierCard({ s }: { s: SupplierDTO }) {
  const contact = [s.contact_name, s.phone].filter(Boolean);
  const bought = num(s.total_purchased) > 0;
  return (
    <Link
      href={`/suppliers/${s.id}`}
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-text-muted/40",
        !s.is_active && "text-text-muted",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-soft font-display text-sm font-bold text-text-secondary">
          {initials(s.business_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", s.is_active ? "text-text-primary" : "text-text-muted")}>{s.business_name}</p>
          <p className="truncate font-mono text-[12px] text-text-muted">RUC {s.ruc}</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[12.5px] text-text-secondary">
          {contact.length > 0 ? (
            <>
              {s.contact_name}
              {s.contact_name && s.phone && " · "}
              {s.phone && <span className="font-mono">{s.phone}</span>}
            </>
          ) : (
            <span className="text-text-muted">Sin contacto</span>
          )}
        </p>
        <Badge tone={s.is_active ? "success" : "neutral"}>{s.is_active ? "Activo" : "Inactivo"}</Badge>
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div className="min-w-0">
          <dt className="text-[11.5px] text-text-muted">Última compra</dt>
          <dd className="truncate text-[13px] text-text-secondary">{dayLabel(s.last_purchase_date)}</dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-[11.5px] text-text-muted">Total comprado</dt>
          <dd className={cn("truncate font-mono text-[14px] font-semibold", bought ? "text-text-primary" : "text-text-muted")}>{bought ? soles(s.total_purchased) : "—"}</dd>
        </div>
      </dl>
    </Link>
  );
}
