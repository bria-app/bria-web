import Link from "next/link";
import { Ban, Receipt, SlidersHorizontal, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { activityTime } from "@/lib/lima";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";
import type { ActivityItem, ActivityKind } from "./types";

const KIND: Record<ActivityKind, { icon: LucideIcon; className: string }> = {
  sale: { icon: Receipt, className: "bg-success-soft text-success" },
  voided: { icon: Ban, className: "bg-danger-soft text-danger" },
  purchase: { icon: Truck, className: "bg-info-soft text-info" },
  adjustment: { icon: SlidersHorizontal, className: "bg-surface-muted text-text-secondary" },
};

/** Latest sales, purchases and inventory adjustments. */
export function ActivityWidget({ items, today }: { items: ActivityItem[]; today: string }) {
  return (
    <WidgetCard title="Actividad" note="Lo último">
      {items.length === 0 ? (
        <WidgetEmpty>
          Aquí verás tus ventas, compras y ajustes.
        </WidgetEmpty>
      ) : (
        <ul className="flex flex-1 flex-col justify-between">
          {items.map((item) => {
            const { icon: Icon, className } = KIND[item.kind];
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-1.5 py-2 text-[13px] transition-colors hover:bg-surface-soft"
                >
                  <span aria-hidden className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", className)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-text-primary">{item.text}</span>
                  <span className="shrink-0 font-mono text-text-primary">{item.amount}</span>
                  <span className="w-11 shrink-0 text-right font-mono text-[11px] text-text-muted">{activityTime(item.at, today)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
