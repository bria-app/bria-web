"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { posApi } from "@/services/api/pos";
import { formatNumber, soles } from "@/lib/format";
import { CountUp } from "@/components/ui/CountUp";
import { limaDate } from "@/lib/lima";

const REFRESH_MS = 60_000;

/**
 * Today's till at a glance in the sidebar: total, number of sales and the best seller. Sellers see only
 * their own sales (the API scopes the summary). Refreshes on navigation and every minute.
 */
export function TodayPulse({ isSeller, onNavigate }: { isSeller: boolean; onNavigate?: () => void }) {
  const companyId = useCompanyId();
  const pathname = usePathname();
  const today = limaDate(new Date());
  const summary = useApi(
    () => (companyId ? posApi.summary(companyId, { date_from: today, date_to: today }) : Promise.resolve(null)),
    [companyId, today, pathname],
  );
  const { reload } = summary;

  useEffect(() => {
    const id = window.setInterval(reload, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [reload]);

  const s = summary.data;
  if (!s) return null;
  const top = s.top_products[0];

  return (
    <section aria-label={isSeller ? "Tus ventas de hoy" : "Ventas de hoy"} className="rounded-2xl border border-border bg-surface p-3.5">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary">
        <span aria-hidden className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        {isSeller ? "Tus ventas de hoy" : "Hoy"}
      </p>
      <p className="mt-1.5 font-mono text-[22px] font-medium leading-none tracking-[-0.02em] text-text-primary"><CountUp value={Number(s.revenue)} format={soles} /></p>
      <p className="mt-1.5 text-[12px] text-text-secondary">
        {s.orders === 0
          ? "Aún sin ventas"
          : `${formatNumber(s.orders)} ${s.orders === 1 ? "venta" : "ventas"} · promedio ${soles(s.avg_ticket)}`}
      </p>
      {top && (
        <p className="mt-2.5 border-t border-border pt-2.5 text-[12px] text-text-muted">
          Lo que más sale
          <span className="block truncate font-medium text-text-primary">{top.name}</span>
        </p>
      )}
      <Link
        href={s.orders === 0 ? "/sales/new" : "/sales"}
        onClick={onNavigate}
        className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent-text hover:underline"
      >
        {s.orders === 0 ? "Abrir la caja" : isSeller ? "Ver mis ventas" : "Ver ventas"} <ArrowRight aria-hidden className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}
