import Link from "next/link";
import { MessageCircle, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, soles } from "@/lib/format";
import type { SupplierSummaryDTO } from "@/types/purchasing";
import { dayLabel } from "@/features/purchases/format";
import { AnimatedFigure } from "@/components/ui/AnimatedFigure";
import { initials } from "./initials";
import { rucKind } from "./ruc";

/** wa.me link for a Peruvian mobile (9 digits starting with 9, with or without 51). */
function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (/^9\d{8}$/.test(digits)) return `https://wa.me/51${digits}`;
  if (/^519\d{8}$/.test(digits)) return `https://wa.me/${digits}`;
  return null;
}

/** Name, RUC, status, the main action and the supplier's purchase figures. */
export function SupplierHeader({ summary }: { summary: SupplierSummaryDTO }) {
  const s = summary.supplier;
  const wa = whatsappHref(s.phone);
  const kind = rucKind(s.ruc);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-border bg-surface-soft font-display text-xl font-bold text-text-muted">
          {initials(s.business_name)}
        </span>
        <div className="min-w-0 flex-1 basis-56 space-y-1.5">
          <h1 className="break-words font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary">{s.business_name}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="font-mono">RUC {s.ruc}</Badge>
            {kind && <Badge>{kind}</Badge>}
            <Badge tone={s.is_active ? "success" : "neutral"}>{s.is_active ? "Activo" : "Inactivo"}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-secondary h-11 gap-2 px-4 text-sm">
              <MessageCircle aria-hidden className="h-4 w-4" /> Escribir por WhatsApp
            </a>
          )}
          <Link href={`/purchases/new?supplier=${s.id}`} className="btn btn-primary h-11 gap-2 px-4 text-sm">
            <PackagePlus aria-hidden className="h-4 w-4" /> Registrar compra
          </Link>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact label="Le compraste" value={soles(summary.total_purchased)} note="sin IGV" />
        <Fact label="Compras" value={formatNumber(summary.documents_count)} note={`${formatNumber(summary.purchases_count)} ${summary.purchases_count === 1 ? "línea" : "líneas"}`} />
        <Fact label="Productos que te vende" value={formatNumber(summary.products_count)} />
        <Fact label="Última compra" value={dayLabel(summary.last_purchase_date)} mono={false} />
      </dl>
    </div>
  );
}

function Fact({ label, value, note, mono = true }: { label: string; value: string; note?: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5">
      <dt className="text-[12px] font-semibold text-text-muted">{label}</dt>
      <dd className={mono ? "mt-1 break-words font-mono text-lg text-text-primary sm:text-xl" : "mt-1 text-lg font-semibold text-text-primary sm:text-xl"}>
        <AnimatedFigure text={value} />
      </dd>
      {note && <dd className="text-[12px] text-text-muted">{note}</dd>}
    </div>
  );
}
