/** Lima calendar helpers: the backend groups sales by Lima date (UTC-5), so the home screen does too. */
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toDate } from "@/lib/format";

const LIMA = "America/Lima";

const dateParts = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA, year: "numeric", month: "2-digit", day: "2-digit" });
const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone: LIMA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** «2026-11-02» for the given instant, in Lima. */
export function limaDate(at: Date | string): string {
  return dateParts.format(toDate(at));
}

/** Minutes since Lima midnight for the given instant. */
export function limaMinutes(at: Date | string): number {
  const [h, m] = timeParts.format(toDate(at)).split(":").map(Number);
  return h * 60 + m;
}

/** «2026-11-02» minus `days` days. */
export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** «Lunes 2 de noviembre» for a Lima date string. */
export function longDate(iso: string): string {
  const text = format(new Date(`${iso}T12:00:00`), "EEEE d 'de' MMMM", { locale: es });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** «Buenos días» / «Buenas tardes» / «Buenas noches» by Lima time. */
export function greeting(at: Date): string {
  const hour = Math.floor(limaMinutes(at) / 60);
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** «10:42» today, «Ayer» yesterday, «28 oct.» before that. */
export function activityTime(at: string, today: string): string {
  const day = limaDate(at);
  if (day === today) {
    const m = limaMinutes(at);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }
  // `today` is empty until the day's figures arrive, and the activity can get here first.
  if (today && day === shiftDate(today, -1)) return "Ayer";
  return format(new Date(`${day}T12:00:00`), "d MMM", { locale: es });
}
