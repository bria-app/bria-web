import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationDTO } from "@/types/api";

const SEVERITY: Record<string, { label: string; tone: BadgeTone }> = {
  critical: { label: "Urgente", tone: "danger" },
  warning: { label: "Atención", tone: "warning" },
  info: { label: "Información", tone: "info" },
};

interface NotificationItemProps {
  notice: NotificationDTO;
  read: boolean;
  /** Absent when this person cannot mark notices (sellers). */
  onMarkRead?: () => void;
  busy: boolean;
}

/** One notice: title with its severity in words, message, when, and «Marcar como leído». */
export function NotificationItem({ notice, read, onMarkRead, busy }: NotificationItemProps) {
  const severity = SEVERITY[notice.severity] ?? { label: notice.severity, tone: "neutral" as const };
  return (
    <li className={cn("flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4", !read && "bg-primary-soft/40")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className={cn("min-w-0 break-words text-[15px] text-text-primary", read ? "font-medium" : "font-semibold")}>
            {notice.title}
          </h2>
          <Badge tone={severity.tone}>{severity.label}</Badge>
        </div>
        <p className="mt-1 break-words text-sm leading-relaxed text-text-secondary">{notice.message}</p>
        <p className="mt-1.5 text-[12.5px] text-text-muted">
          <time dateTime={notice.created_at} title={dateTime(notice.created_at)}>
            {timeAgo(notice.created_at)}
          </time>
          {!read && <span className="font-semibold text-accent-text"> · Sin leer</span>}
        </p>
      </div>
      {!read && onMarkRead && (
        <Button variant="ghost" size="sm" loading={busy} onClick={onMarkRead} className="self-start">
          Marcar como leído
        </Button>
      )}
    </li>
  );
}
