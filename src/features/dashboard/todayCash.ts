import { posApi } from "@/services/api/pos";
import type { PaymentMethod, SalesOrderRow } from "@/types/pos";
import { limaDate, limaMinutes, shiftDate } from "@/lib/lima";

const PAGE_SIZE = 200;
const MAX_PAGES = 10;

export interface HourBucket {
  hour: number;
  today: number;
  yesterday: number;
}

export interface TodayCash {
  /** Lima date the numbers belong to. */
  today: string;
  /** When the numbers were fetched (drives the greeting and «a esta hora»). */
  fetchedAt: Date;
  total: number;
  tickets: number;
  byPayment: { method: PaymentMethod; total: number; orders: number }[];
  hours: HourBucket[];
  /** False when there were too many sales to read every page: then yesterday is not compared. */
  complete: boolean;
  /** Yesterday's sales up to the same Lima time; null when it cannot be compared honestly. */
  yesterdaySoFar: number | null;
}

/** Completed till sales for yesterday and today, every page (capped). */
async function fetchTickets(companyId: string, from: string, to: string) {
  const items: SalesOrderRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await posApi.list(companyId, { date_from: from, date_to: to, status: "completed", page, size: PAGE_SIZE });
    items.push(...res.items);
    if (page >= res.pages) return { items, complete: true };
  }
  return { items, complete: false };
}

/** Today's till from real sales, plus yesterday at the same hour when both days are complete. */
export async function loadTodayCash(companyId: string): Promise<TodayCash> {
  const fetchedAt = new Date();
  const today = limaDate(fetchedAt);
  const yesterday = shiftDate(today, -1);
  const { items, complete } = await fetchTickets(companyId, yesterday, today);

  const nowMinutes = limaMinutes(fetchedAt);
  const byHour = new Map<number, { today: number; yesterday: number }>();
  const pay = new Map<PaymentMethod, { total: number; orders: number }>();
  let total = 0;
  let tickets = 0;
  let yesterdaySoFar = 0;

  for (const t of items) {
    const amount = Number(t.total) || 0;
    const day = limaDate(t.sold_at);
    const minutes = limaMinutes(t.sold_at);
    const hour = Math.floor(minutes / 60);
    const bucket = byHour.get(hour) ?? { today: 0, yesterday: 0 };
    if (day === today) {
      total += amount;
      tickets += 1;
      bucket.today += amount;
      const p = pay.get(t.payment_method) ?? { total: 0, orders: 0 };
      pay.set(t.payment_method, { total: p.total + amount, orders: p.orders + 1 });
    } else if (day === yesterday) {
      bucket.yesterday += amount;
      if (minutes <= nowMinutes) yesterdaySoFar += amount;
    }
    byHour.set(hour, bucket);
  }

  const seen = [...byHour.keys()];
  const first = Math.min(8, ...seen);
  const last = Math.max(20, ...seen);
  const hours: HourBucket[] = [];
  for (let h = first; h <= last; h += 1) hours.push({ hour: h, ...(byHour.get(h) ?? { today: 0, yesterday: 0 }) });

  return {
    today,
    fetchedAt,
    total,
    tickets,
    byPayment: [...pay.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.total - a.total),
    hours,
    complete,
    yesterdaySoFar: complete && yesterdaySoFar > 0 ? yesterdaySoFar : null,
  };
}
