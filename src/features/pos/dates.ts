/** Date ranges for the sales filters, pinned to the store's time zone (America/Lima). */
import { limaDate, shiftDate } from "@/lib/lima";

export type RangePreset = "today" | "7d" | "30d" | "month" | "all";

export const RANGE_LABEL: Record<RangePreset, string> = {
  today: "Hoy",
  "7d": "7 días",
  "30d": "30 días",
  month: "Este mes",
  all: "Todo",
};

export function presetRange(preset: RangePreset): { from: string; to: string } {
  const today = limaDate(new Date());
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: shiftDate(today, -6), to: today };
    case "30d":
      return { from: shiftDate(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "all":
      // Wide enough to cover any imported history.
      return { from: "2000-01-01", to: today };
  }
}
