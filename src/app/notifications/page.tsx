"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListStatus } from "@/components/ui/ListStatus";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { useInfiniteList, useLoadsMore } from "@/hooks/useInfiniteList";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useReloadOn } from "@/hooks/useReloadOn";
import { useRole } from "@/hooks/useRole";
import { NOTIFICATIONS_CHANGED, notificationsApi } from "@/services/api/resources";
import type { NotificationDTO } from "@/types/api";
import { formatNumber } from "@/lib/format";
import { NotificationItem } from "./NotificationItem";

const PAGE_SIZE = 25;

type Filter = "unread" | "all";

/** Avisos: the company's notices (GET /notifications), filtered and paged by the API. */
export default function NotificationsPage() {
  const companyId = useCompanyId();
  const toast = useToast();
  const { isSeller } = useRole();
  const [filter, setFilter] = useState<Filter>("unread");
  const notices = useInfiniteList<NotificationDTO>(
    (page) =>
      companyId
        ? notificationsApi
            .list(companyId, PAGE_SIZE, { page, unreadOnly: filter === "unread" })
            .then((r) => ({ items: r.items, total: r.total, hasMore: page < r.pages }))
        : Promise.resolve({ items: [], total: 0, hasMore: false }),
    (n) => n.id,
    [companyId, filter],
  );
  useLoadsMore(notices);
  const count = useApi(
    () => (companyId ? notificationsApi.unreadCount(companyId) : Promise.resolve(null)),
    [companyId],
  );
  // Notices marked from the bell in the top bar show as read here too.
  useReloadOn(NOTIFICATIONS_CHANGED, () => {
    notices.reload();
    count.reload();
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [bulk, setBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = notices.items;
  const total = notices.total ?? 0;
  const isRead = (n: NotificationDTO) => n.is_read || readIds.has(n.id);
  const unreadCount = count.data?.unread ?? items.filter((n) => !isRead(n)).length;

  const countLabel = `${formatNumber(total)} ${total === 1 ? "aviso" : "avisos"}${filter === "unread" ? " sin leer" : ""}`;


  const markRead = async (id: string) => {
    if (!companyId) return;
    setError(null);
    setBusy((b) => new Set([...b, id]));
    try {
      await notificationsApi.markRead(companyId, id);
      setReadIds((r) => new Set([...r, id]));
    } catch {
      setError("No se pudo marcar el aviso. Inténtalo de nuevo.");
    } finally {
      setBusy((b) => new Set([...b].filter((x) => x !== id)));
    }
  };

  // One call marks every unread notice of the company, not only this page.
  const markAll = async () => {
    if (!companyId) return;
    setError(null);
    setBulk(true);
    try {
      const res = await notificationsApi.markAllRead(companyId);
      setReadIds((r) => new Set([...r, ...items.map((n) => n.id)]));
      toast(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron marcar los avisos. Inténtalo de nuevo.");
    } finally {
      setBulk(false);
    }
  };

  const canMark = !isSeller;

  return (
    <div className="mx-auto flex max-w-[880px] flex-col">
      <PageHeader
        title="Avisos"
        description="Lo que bria te dejó para revisar."
        action={canMark && unreadCount > 0 && (
          <Button variant="secondary" loading={bulk} onClick={() => void markAll()}>
            Marcar todo como leído
          </Button>
        )}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar avisos">
        <Chip active={filter === "unread"} onClick={() => setFilter("unread")} count={count.data ? unreadCount : undefined}>
          Sin leer
        </Chip>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>Todos</Chip>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

      <DataState
        loading={notices.loading && items.length === 0}
        error={notices.error}
        onRetry={notices.reload}
        empty={!notices.loading && items.length === 0}
        emptyState={
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "Leíste todos tus avisos" : "No tienes avisos"}
            description={
              isSeller
                ? "Cuando haya algo para ti, aparece aquí. Para ver qué queda, usa «Consultar inventario»."
                : "Cuando termine un pronóstico, aquí te avisamos qué comprar y qué se está acabando."
            }
            action={isSeller ? { label: "Consultar inventario", href: "/sales/stock" } : { label: "Ir a Hoy", href: "/dashboard" }}
          />
        }
      >
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notice={n}
              read={isRead(n)}
              busy={busy.has(n.id)}
              onMarkRead={canMark ? () => void markRead(n.id) : undefined}
            />
          ))}
        </ul>
        <div className="mt-3">
          <ListStatus variant="cards" loading={notices.loadingMore} onRetry={notices.moreFailed ? notices.loadMore : undefined}>
            {items.length < total && `Viendo ${formatNumber(items.length)} de `}
            {countLabel}
          </ListStatus>
        </div>
        {isSeller && <p className="mt-3 text-[13px] text-text-muted">Con tu usuario de ventas puedes leer los avisos, pero no marcarlos.</p>}
      </DataState>
    </div>
  );
}
