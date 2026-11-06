"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ListStatus } from "@/components/ui/ListStatus";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApi } from "@/hooks/useApi";
import { useListView } from "@/hooks/useDevicePref";
import { useInfiniteList, useLoadsMore } from "@/hooks/useInfiniteList";
import { posApi } from "@/services/api/pos";
import { usersApi } from "@/services/api/users";
import { formatNumber } from "@/lib/format";
import { presetRange, type RangePreset } from "@/features/pos/dates";
import { SalesBoard } from "./SalesBoard";
import { SalesFilters, type SalesFilterValue } from "./SalesFilters";
import { SalesSummaryStrip } from "./SalesSummaryStrip";
import { SalesTable } from "./SalesTable";

const PAGE_SIZE = 25;

/** A seller deep link (from the team sheet) opens their last 30 days. */
const initialFilters = (sellerId: string): SalesFilterValue => ({
  period: sellerId ? "30d" : "7d",
  ...presetRange(sellerId ? "30d" : "7d"),
  docType: "",
  status: "",
  sellerId,
  search: "",
});

interface OrdersViewProps {
  companyId: string;
  isSeller: boolean;
  canFilterSeller: boolean;
  /** Bumped after an import so the list and totals reload. */
  refreshKey: number;
  /** Preselected seller (`/sales?vendedor=<id>`). */
  initialSellerId?: string;
}

/** Sales list with its period summary. Sellers only get their own sales (enforced by the API). */
export function OrdersView({ companyId, isSeller, canFilterSeller, refreshKey, initialSellerId = "" }: OrdersViewProps) {
  // The API keeps sellers to their own tickets, so the preselection needs no role check here.
  const [filters, setFilters] = useState(() => initialFilters(initialSellerId));
  const [q, setQ] = useState("");
  const [view] = useListView("ventas");

  useEffect(() => {
    const t = window.setTimeout(() => setQ(filters.search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  const change = (patch: Partial<SalesFilterValue>) => setFilters((f) => ({ ...f, ...patch }));
  const choosePreset = (preset: RangePreset) => change({ period: preset, ...presetRange(preset) });

  const { from, to, sellerId, docType, status } = filters;
  const summary = useApi(
    () => posApi.summary(companyId, { date_from: from, date_to: to, seller_id: sellerId || undefined }),
    [companyId, from, to, sellerId, refreshKey],
  );
  const orders = useInfiniteList(
    (page) =>
      posApi
        .list(companyId, {
          date_from: from,
          date_to: to,
          seller_id: sellerId || undefined,
          document_type: docType || undefined,
          status: status || undefined,
          q: q || undefined,
          page,
          size: PAGE_SIZE,
        })
        .then((r) => ({ items: r.items, total: r.total, hasMore: page < r.pages })),
    (o) => o.id,
    [companyId, from, to, sellerId, docType, status, q, refreshKey],
  );
  useLoadsMore(orders);
  const users = useApi(() => (canFilterSeller ? usersApi.list(companyId) : Promise.resolve([])), [companyId, canFilterSeller]);

  const sellerOptions = useMemo(() => {
    if (!canFilterSeller) return undefined;
    const names = new Map<string, string>();
    (users.data ?? []).forEach((u) => names.set(u.id, u.full_name));
    (summary.data?.by_seller ?? []).forEach((s) => s.seller_id && !names.has(s.seller_id) && names.set(s.seller_id, s.seller_name));
    return [{ value: "", label: "Todos los vendedores" }, ...[...names].map(([value, label]) => ({ value, label }))];
  }, [canFilterSeller, users.data, summary.data]);

  const rows = orders.items;
  const total = orders.total ?? 0;
  const filtered = !!(q || docType || status || sellerId);
  const listStatus = (variant: "table" | "cards") => (
    <ListStatus variant={variant} loading={orders.loadingMore} onRetry={orders.moreFailed ? orders.loadMore : undefined}>
      {rows.length < total && `Viendo ${formatNumber(rows.length)} de `}
      {formatNumber(total)} {total === 1 ? "venta" : "ventas"}
    </ListStatus>
  );

  return (
    <div className="flex flex-col gap-6">
      <SalesFilters value={filters} onChange={change} onPreset={choosePreset} sellerOptions={sellerOptions} />
      <SalesSummaryStrip summary={summary.data} loading={summary.loading} showMargin={!isSeller} />

      <DataState
        loading={orders.loading && rows.length === 0}
        error={orders.error}
        empty={!orders.loading && rows.length === 0}
        onRetry={orders.reload}
        emptyState={
          <EmptyState
            icon={Receipt}
            title={filtered ? "Ninguna venta coincide" : "No hay ventas en estas fechas"}
            description={filtered ? "Prueba con otro texto o quita algún filtro." : "Cobra desde la caja o mira otro periodo."}
            hint={
              filters.period === "all" ? undefined : (
                <button type="button" onClick={() => choosePreset("all")} className="text-[13px] font-semibold text-accent-text hover:underline">
                  Ver todo el historial
                </button>
              )
            }
          />
        }
      >
        {view === "tarjetas" ? (
          <div className="flex flex-col gap-3">
            <SalesBoard rows={rows} showSeller={!isSeller} dimmed={orders.loading} />
            {listStatus("cards")}
          </div>
        ) : (
          <Card className="overflow-clip p-0">
            <SalesTable rows={rows} showSeller={!isSeller} dimmed={orders.loading} />
            {listStatus("table")}
          </Card>
        )}
      </DataState>
    </div>
  );
}
