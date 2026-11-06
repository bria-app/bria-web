import { soles } from "@/lib/format";
import type { HourBucket } from "./todayCash";

interface HourBarsProps {
  hours: HourBucket[];
  showYesterday: boolean;
  total: number;
}

/** Sales per hour today (accent), next to yesterday (muted) when it can be shown. Grows with the room its card has. */
export function HourBars({ hours, showYesterday, total }: HourBarsProps) {
  const max = Math.max(1, ...hours.map((h) => Math.max(h.today, showYesterday ? h.yesterday : 0)));
  const pct = (v: number) => `${Math.round((v / max) * 100)}%`;

  return (
    <div
      role="img"
      aria-label={`Ventas por hora de hoy${showYesterday ? " frente a ayer" : ""}. Total de hoy ${soles(total)}.`}
      className="flex min-h-28 flex-1 gap-1 sm:gap-1.5"
    >
      {hours.map((h) => (
        <div
          key={h.hour}
          title={`${h.hour}:00 · hoy ${soles(h.today)}${showYesterday ? ` · ayer ${soles(h.yesterday)}` : ""}`}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <div className="relative w-full flex-1">
            <div className="absolute inset-0 flex items-end gap-px">
              {showYesterday && <span className="flex-1 rounded-t-[3px] bg-border" style={{ height: pct(h.yesterday) }} />}
              <span className="flex-1 rounded-t-[3px] bg-primary" style={{ height: pct(h.today) }} />
            </div>
          </div>
          <span className="font-mono text-[10px] text-text-muted">{h.hour}</span>
        </div>
      ))}
    </div>
  );
}
