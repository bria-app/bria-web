import { formatNumber } from "@/lib/format";
import type { BadgeTone } from "@/components/ui/Badge";
import type { TrackingStatus } from "@/types/forecasting";

/** «1 234» or with fixed decimals. Kept for screens outside this folder that already use it. */
export const num = (v: number | null | undefined, digits = 0) => formatNumber(v ?? 0, digits);

/** «12.5 %», or «—» when there is no value. */
export const pct = (v: number | null | undefined, digits = 1) =>
  v == null || !Number.isFinite(Number(v)) ? "—" : `${formatNumber(v, digits)} %`;

/** Forecast units, in whole units (nobody buys 6.6 name tags): «≈ 7», «menos de 1», «0». */
export const approx = (v: number | null | undefined) => {
  const n = Math.max(0, Number(v ?? 0));
  if (n === 0) return "0";
  if (n < 0.5) return "menos de 1";
  return `≈ ${formatNumber(Math.round(n), 0)}`;
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-03-01" → "mar 26" (monthly) or "16 mar" (weekly). Parsed by hand: no timezone shift. */
export function periodLabel(iso: string | null | undefined, frequency: string | null = "monthly") {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (frequency === "weekly") return `${d} ${MONTHS[m - 1]}`;
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** "2026-03-01" → "1 mar 2026". */
export function dateLabel(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Qualifier for every accuracy shown to the user: it is measured by re-running the engine on
 * the shop's own past sales, and that procedure tends to overstate accuracy.
 */
export const ACCURACY_CAVEAT = "estimado con tus ventas pasadas; puede ser optimista";

export const frequencyLabel: Record<string, string> = {
  auto: "Automática",
  monthly: "Mensual",
  weekly: "Semanal",
  mixed: "Mixta (por producto)",
};

/** Technical model names (expert wording). */
export const modelLabel: Record<string, string> = {
  DEMO: "Demostración (simulado)",
  FTGM: "FTGM",
  FTGMCombo: "FTGM combinado",
  DampedTrend: "Suavizado de nivel",
  SeasonalDamped: "Suavizado estacional",
  SeasonalNaive: "Temporada anterior",
  CrostonSBA: "Croston-SBA",
  MovingAverage: "Promedio móvil",
  None: "Sin pronóstico",
};

/** The same models, said the way the shop owner would. */
const METHOD_PLAIN: Record<string, string> = {
  DEMO: "Simulado (demostración)",
  FTGM: "Sigue la temporada",
  FTGMCombo: "Mezcla de dos métodos",
  DampedTrend: "Tendencia suavizada",
  SeasonalDamped: "Temporada, más prudente",
  SeasonalNaive: "Igual que el año pasado",
  CrostonSBA: "Ventas esporádicas",
  MovingAverage: "Promedio reciente",
  None: "Sin pronóstico",
};

export function methodName(model: string | null | undefined, expert: boolean): string {
  const key = model || "None";
  return (expert ? modelLabel[key] : METHOD_PLAIN[key]) ?? key;
}

export const trackingMeta: Record<TrackingStatus, { label: string; tone: BadgeTone }> = {
  en_linea: { label: "Va según lo previsto", tone: "success" },
  sobre_pronostico: { label: "Vendes menos de lo previsto", tone: "warning" },
  bajo_pronostico: { label: "Vendes más de lo previsto", tone: "warning" },
  pendiente: { label: "Aún sin ventas que comparar", tone: "neutral" },
};

/** "1 mes", "3 meses", "2 semanas". */
export const horizonLabel = (days: number) => {
  if (days % 365 === 0) return `${days / 365} año${days / 365 > 1 ? "s" : ""}`;
  const months = Math.round(days / 30);
  return months >= 1 ? `${months} mes${months > 1 ? "es" : ""}` : `${days} días`;
};

/** "para el próximo mes" / "para los próximos 3 meses" / "para el próximo año" / "para las próximas 2 semanas". */
export function forWhen(days: number): string {
  if (days >= 365 && days % 365 === 0) {
    const y = days / 365;
    return y === 1 ? "para el próximo año" : `para los próximos ${y} años`;
  }
  if (days % 30 === 0 || days >= 28) {
    const m = Math.max(1, Math.round(days / 30));
    return m === 1 ? "para el próximo mes" : `para los próximos ${m} meses`;
  }
  const w = Math.max(1, Math.round(days / 7));
  return w === 1 ? "para la próxima semana" : `para las próximas ${w} semanas`;
}

/** "14 meses" / "30 semanas". */
export function historyLabel(periods: number, frequency: string | null): string {
  const weekly = frequency === "weekly";
  const unit = weekly ? (periods === 1 ? "semana" : "semanas") : periods === 1 ? "mes" : "meses";
  return `${formatNumber(periods)} ${unit}`;
}

/** Fewer periods than this means the pattern is still a guess (half a year, or a quarter in weeks). */
export const isShortHistory = (periods: number, frequency: string | null) => periods < (frequency === "weekly" ? 13 : 6);
