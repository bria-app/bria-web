import { cn } from "@/lib/utils";
import type { FtgmQuota } from "@/types/forecasting";
import { quotaSentence } from "./plan-data";

/** This month's AI predictions against the plan limit (GET /forecast-runs/quota). */
export function QuotaMeter({ quota, className }: { quota: FtgmQuota; className?: string }) {
  const limit = quota.monthly_limit;
  const full = limit !== null && quota.used >= limit;
  const pct = limit ? Math.min(100, Math.round((quota.used / limit) * 100)) : 100;

  return (
    <div className={cn("flex flex-col gap-2.5 rounded-xl bg-surface-soft p-4", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-text-primary">Predicciones con IA este mes</span>
        <span className="font-mono text-text-primary">
          {limit === null ? `${quota.used} · sin límite` : `${quota.used} de ${limit}`}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Predicciones usadas este mes"
        aria-valuemin={0}
        aria-valuemax={limit ?? quota.used}
        aria-valuenow={quota.used}
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className={cn("h-full rounded-full", limit === null ? "bg-success" : full ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn("text-[13px] leading-snug", full ? "text-warning" : "text-text-secondary")}>{quotaSentence(quota)}</p>
    </div>
  );
}
