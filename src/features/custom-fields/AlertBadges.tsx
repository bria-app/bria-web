import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { ProductAlert } from "@/types/custom-fields";

interface AlertBadgesProps {
  alerts: ProductAlert[];
  /** Show the column name before the alert («Vencimiento · Por vencer»). */
  withColumn?: boolean;
  /** At most this many; the rest fold into «+2». */
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

/** A product's own-column alerts as small badges. Text always says what it is; color only backs it. */
export function AlertBadges({ alerts, withColumn = true, max, size = "sm", className }: AlertBadgesProps) {
  if (alerts.length === 0) return null;
  const shown = max ? alerts.slice(0, max) : alerts;
  const rest = alerts.length - shown.length;
  const small = size === "sm";
  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-center gap-1", className)}>
      {shown.map((a) => (
        <span key={a.key} title={withColumn || !a.column ? undefined : `${a.column}: ${a.label}`} className="inline-flex max-w-full">
          <Badge tone={a.tone === "danger" ? "danger" : "warning"} className={cn("max-w-full", small ? "px-2 py-0 text-[11px] font-semibold" : "text-[12px]")}>
            <AlertTriangle aria-hidden className={small ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} />
            <span className="truncate">
              {withColumn ? (
                <span className="font-medium opacity-80">{a.column} · </span>
              ) : (
                a.column && <span className="sr-only">{a.column}: </span>
              )}
              {a.label}
            </span>
          </Badge>
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[11.5px] font-semibold text-text-muted" title={alerts.slice(shown.length).map((a) => `${a.column}: ${a.label}`).join(" · ")}>
          +{rest}
          <span className="sr-only"> {rest === 1 ? "alerta más" : "alertas más"}</span>
        </span>
      )}
    </span>
  );
}
