"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS_CHANGED, notificationsApi } from "@/services/api/resources";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useReloadOn } from "@/hooks/useReloadOn";
import { useRole } from "@/hooks/useRole";
import { timeAgo } from "@/lib/format";
import { useDismiss } from "./useDismiss";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-danger",
  warning: "bg-warning",
  medium: "bg-warning",
};

const LATEST = 6;

/**
 * Bell with the latest notices. The dot comes from the unread count endpoint; «mark all» is one
 * call. Every mark fires NOTIFICATIONS_CHANGED, so marks made on /notifications clear the dot too.
 * Sellers can read notices but the API refuses their marks (403), so they get no mark actions.
 */
export function NotificationsMenu() {
  const companyId = useCompanyId();
  const { isSeller } = useRole();
  const canMark = !isSeller;
  const notices = useApi(
    () => (companyId ? notificationsApi.list(companyId, LATEST) : Promise.resolve(null)),
    [companyId],
  );
  const count = useApi(
    () => (companyId ? notificationsApi.unreadCount(companyId) : Promise.resolve(null)),
    [companyId],
  );
  const reloadAll = () => {
    notices.reload();
    count.reload();
  };
  useReloadOn(NOTIFICATIONS_CHANGED, reloadAll);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const items = notices.data?.items ?? [];
  // Fall back to the loaded page if the count has not arrived (or failed).
  const unread = count.data?.unread ?? items.filter((n) => !n.is_read).length;

  // Each successful mark fires NOTIFICATIONS_CHANGED, which reloads the list and the count.
  const markOne = (id: string) => {
    if (!companyId || !canMark) return;
    void notificationsApi.markRead(companyId, id).catch(() => undefined);
  };

  const markAll = async () => {
    if (!companyId || !canMark) return;
    setMarking(true);
    try {
      await notificationsApi.markAllRead(companyId);
    } catch {
      // The list stays as it was; the full page shows the error if it repeats.
    } finally {
      setMarking(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Avisos, ${unread} sin leer` : "Avisos"}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:text-text-primary"
      >
        <Bell aria-hidden className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Avisos"
          className="pop-in absolute right-0 top-12 z-50 w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-2 shadow-soft-xl"
        >
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-sm font-semibold">Avisos</span>
            {canMark && unread > 0 && (
              <button
                type="button"
                onClick={() => void markAll()}
                disabled={marking}
                className="text-[13px] font-semibold text-accent-text hover:underline disabled:opacity-60"
              >
                {marking ? "Marcando…" : "Marcar todo como leído"}
              </button>
            )}
          </div>
          {notices.loading && !notices.data && <p className="px-3 py-6 text-center text-sm text-text-muted">Cargando…</p>}
          {!notices.loading && notices.error && !notices.data && (
            <div className="flex flex-col items-center gap-2 px-3 py-5 text-center">
              <p className="text-sm text-text-secondary">No pudimos traer tus avisos.</p>
              <button type="button" onClick={reloadAll} className="text-[13px] font-semibold text-accent-text hover:underline">
                Reintentar
              </button>
            </div>
          )}
          {notices.data && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-text-muted">No tienes avisos.</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {items.map((n) => {
              const body = (
                <>
                  <span aria-hidden className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[n.severity] ?? "bg-info")} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn("break-words text-[13px]", n.is_read ? "font-medium" : "font-bold")}>{n.title}</span>
                    <span className="line-clamp-2 text-[12px] text-text-secondary">{n.message}</span>
                    <span className="text-[11px] text-text-muted">
                      {timeAgo(n.created_at)}
                      {!n.is_read && <span className="sr-only"> · sin leer</span>}
                    </span>
                  </span>
                </>
              );
              const rowClass = cn("flex w-full gap-3 rounded-xl px-3 py-2.5 text-left", !n.is_read && "bg-surface-soft");
              return (
                <li key={n.id}>
                  {canMark ? (
                    <button
                      type="button"
                      onClick={() => !n.is_read && markOne(n.id)}
                      className={cn(rowClass, "hover:bg-surface-muted")}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className={rowClass}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link
            href="/notifications"
            onClick={close}
            className="mt-1 block rounded-xl px-3 py-2 text-center text-[13px] font-semibold text-text-secondary hover:bg-surface-muted"
          >
            Ver todos los avisos
          </Link>
        </div>
      )}
    </div>
  );
}
