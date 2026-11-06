/** Number, money and date formatting in Peruvian Spanish. Use these instead of ad-hoc toLocaleString. */
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Numeric = number | string | null | undefined;

const toNumber = (v: Numeric) => Number(v ?? 0) || 0;

/** «S/ 1,234.50» */
export const soles = (v: Numeric) =>
  `S/ ${toNumber(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** «1,234» (no decimals) or with a fixed number of decimals. */
export const formatNumber = (v: Numeric, decimals = 0) =>
  toNumber(v).toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** «1 día» / «12 días»: the count (no decimals) with the singular or plural noun, as shown. */
export const plural = (n: Numeric, one: string, many: string) =>
  `${formatNumber(n)} ${Math.round(toNumber(n)) === 1 ? one : many}`;

/** «12 u» */
export const units = (v: Numeric) => `${formatNumber(v)} u`;

/** 0.314 → «31 %» */
export const percent = (ratio: Numeric, decimals = 0) => `${formatNumber(toNumber(ratio) * 100, decimals)} %`;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const NO_ZONE = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Reads an API date. A plain day («2026-11-02») is that calendar day here, not UTC midnight
 * (which in Lima is the day before). A timestamp without zone is UTC, as the API stores it.
 */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const day = DATE_ONLY.exec(value);
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  return new Date(NO_ZONE.test(value) ? `${value}Z` : value);
}

const LIMA_CLOCK = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * What a Lima clock shows for an API timestamp, as a local Date for date-fns, so a sale at 23:30
 * stays on its day whatever the device's time zone. Plain days and Date objects are kept as given.
 */
function limaClock(value: string | Date): Date {
  const d = toDate(value);
  if (value instanceof Date || DATE_ONLY.test(value) || Number.isNaN(d.getTime())) return d;
  const p = Object.fromEntries(LIMA_CLOCK.formatToParts(d).map((x) => [x.type, x.value]));
  return new Date(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
}

/** date-fns throws on an invalid date: a missing or malformed value reads «—» instead of crashing the screen. */
function safeFormat(value: string | Date, pattern: string): string {
  const d = limaClock(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, pattern, { locale: es });
}

/** «2 nov 2026» */
export const shortDate = (iso: string | Date) => safeFormat(iso, "d MMM yyyy");

/** «2 nov 2026, 10:42» (Lima time) */
export const dateTime = (iso: string | Date) => safeFormat(iso, "d MMM yyyy, HH:mm");

/** «hace 5 minutos» */
export const timeAgo = (iso: string | Date) => {
  const d = toDate(iso);
  return Number.isNaN(d.getTime()) ? "—" : formatDistanceToNow(d, { addSuffix: true, locale: es });
};
