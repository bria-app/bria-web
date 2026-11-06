import type { BadgeTone } from "@/components/ui/Badge";
import { plural, soles } from "@/lib/format";
import type { OverviewProduct } from "@/types/forecasting";

/**
 * Plain-language decision dictionary for a retail owner: what to DO with each product after
 * a forecast. Every forecast row maps to exactly one action, chosen by simple, explainable
 * rules on inventory, expected sales, days of cover, supplier lead time and trend.
 */
type ActionId = "reponer_ya" | "reponer" | "descontinuar" | "no_comprar" | "baja" | "crece" | "mantener";

export const ACTIONS: Record<ActionId, { title: string; tone: BadgeTone }> = {
  reponer_ya: { title: "Repón ya", tone: "danger" },
  reponer: { title: "Repón pronto", tone: "warning" },
  descontinuar: { title: "Descontinúa", tone: "neutral" },
  no_comprar: { title: "No compres por ahora", tone: "accent" },
  baja: { title: "Pide menos", tone: "warning" },
  crece: { title: "Pide más", tone: "success" },
  mantener: { title: "Todo en orden", tone: "success" },
};

interface Decision {
  action: ActionId;
  sentence: string;
  /** Expected sales per week/month in plain words ("≈ 12 por semana"). */
  rate: string;
  /** Days the current inventory lasts, or null if it can't be said. */
  coverDays: number | null;
  /** "Sin datos" when the engine could not measure its accuracy on past sales. */
  confidence: Confidence;
}

type Confidence = "Alta" | "Media" | "Baja" | "Sin datos";

/** Shown instead of a confidence level when there is no accuracy to base it on. */
const NO_ACCURACY_TEXT = "Sin datos suficientes para medir el acierto";

const round = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);
/** «1 día» / «12 días», or `fallback` («pocos días») when the cover can't be said. */
const days = (n: number | null, fallback = "pocos días") => (n == null ? fallback : plural(n, "día", "días"));

/** The order to look at products in: what can't wait first. */
const ORDER: ActionId[] = ["reponer_ya", "reponer", "crece", "baja", "no_comprar", "descontinuar", "mantener"];
export const urgencyRank = (p: OverviewProduct) => (p.status === "skipped" ? ORDER.length : ORDER.indexOf(decide(p).action));

/** Goes on the purchase list: the run asks for units and the advice is not "don't restock". */
export function isToBuy(p: OverviewProduct): boolean {
  return p.needs_restock && p.suggested_qty > 0 && !["no_comprar", "descontinuar"].includes(decide(p).action);
}

export function decide(p: OverviewProduct): Decision {
  const perWeek = p.frequency === "weekly";
  const periodDays = perWeek ? 7 : 30;
  const unit = perWeek ? "sem." : "mes";
  const rateN = Math.max(0, p.next_period_units);
  const rate = rateN < 0.5 ? "casi nada" : `≈ ${round(rateN)}/${unit}`;
  const daily = rateN / periodDays;
  const cover = p.coverage_days != null ? Math.round(p.coverage_days) : daily > 0 ? Math.round(p.on_hand / daily) : null;
  const buy = p.suggested_qty > 0 ? `Compra ${Math.ceil(p.suggested_qty)} u (≈ ${soles(p.suggested_investment)})` : "Haz un pedido";
  const confidence = confidenceOf(p.accuracy_pct ?? null);
  const base = { rate, coverDays: cover, confidence };
  const trend = p.trend_pct ?? 0;

  if (p.total_forecast_units < 1) {
    return {
      ...base,
      action: "descontinuar",
      sentence:
        p.on_hand > 0
          ? `Casi no se vende. Liquida ${p.on_hand === 1 ? "la unidad que te queda" : `las ${p.on_hand} unidades que te quedan`} con una promoción y no vuelvas a comprarlo.`
          : "Ya casi no se vende. No vuelvas a comprarlo.",
    };
  }
  // Slow mover: a product that barely sells never gets pushed into a big purchase, even if
  // it ran out. Keep a thin inventory (or let it go) instead of tying money up in it.
  if (p.total_forecast_units < 3 && rateN < 1) {
    const perMonth = round(rateN * (perWeek ? 4.3 : 1));
    return {
      ...base,
      action: "no_comprar",
      sentence:
        p.on_hand > 0
          ? `Se vende muy poco (≈ ${perMonth} al mes) y todavía tienes ${p.on_hand} u. Mantén poco inventario: no repongas por ahora.`
          : `Se vende muy poco (≈ ${perMonth} al mes). No conviene reponerlo: pide solo si un cliente te lo encarga.`,
    };
  }
  if (p.on_hand <= 0) {
    return { ...base, action: "reponer_ya", sentence: `Se te acabó y el pronóstico espera que se siga vendiendo (${rate}). ${buy} cuanto antes.` };
  }
  // Fast mover about to run into the supplier's wait: always top of the list.
  if (rateN >= 20 && cover != null && cover <= p.lead_time_days + 7) {
    return {
      ...base,
      action: "reponer_ya",
      sentence: `Se vende rápido (${rate}) y te alcanza para unos ${days(cover)}, menos de lo que demora tu proveedor (${days(p.lead_time_days)}). ${buy} hoy mismo.`,
    };
  }
  if (p.needs_restock && p.stockout_risk === "alto") {
    return {
      ...base,
      action: "reponer_ya",
      sentence: `Te alcanza para unos ${days(cover)} y tu proveedor demora ${days(p.lead_time_days)}. ${buy} ya para que no se te agote.`,
    };
  }
  if (p.needs_restock || p.suggested_qty > 0) {
    // Same rule as the API: buy when inventory won't cover the supplier's wait + 2 weeks + minimum.
    const window = p.lead_time_days + 14;
    const byMinimum = cover != null && cover >= window && p.safety_stock > 0;
    return {
      ...base,
      action: "reponer",
      sentence: byMinimum
        ? `Tienes para unos ${days(cover)}, pero antes de que llegue un pedido bajarías de tu inventario mínimo (${p.safety_stock} u). ${buy} en tu próximo pedido.`
        : `Pronto te faltará: tienes para unos ${days(cover)} y tu proveedor demora ${days(p.lead_time_days)}. ${buy} esta semana.`,
    };
  }
  if (cover != null && cover > 120) {
    return {
      ...base,
      action: "no_comprar",
      sentence: `Tienes inventario para unos ${Math.round(cover / 30)} meses. No compres por ahora; una promoción te ayuda a venderlo más rápido.`,
    };
  }
  if (trend <= -25) {
    return { ...base, action: "baja", sentence: `Se está vendiendo menos (${Math.abs(Math.round(trend))} % menos que en los últimos meses). Tienes para ${days(cover, "varios días")}: en tu próxima compra pide menos cantidad.` };
  }
  if (trend >= 25) {
    return { ...base, action: "crece", sentence: `Se está vendiendo más (${Math.round(trend)} % más que en los últimos meses). En tu próxima compra pide más y ponlo a la vista.` };
  }
  return {
    ...base,
    action: "mantener",
    sentence: cover != null ? `Tienes para unos ${days(cover)}. No necesitas hacer nada por ahora.` : "Tu inventario está bien. No necesitas hacer nada por ahora.",
  };
}

/**
 * How sure we are, from the plain accuracy the engine measured on the shop's own past sales
 * (100 − % of units missed on the forecast total). No accuracy → "Sin datos": a level is
 * never claimed without a measurement behind it.
 */
function confidenceOf(accuracy: number | null | undefined): Confidence {
  if (accuracy == null || !Number.isFinite(accuracy)) return "Sin datos";
  return accuracy >= 75 ? "Alta" : accuracy >= 55 ? "Media" : "Baja";
}

/** The confidence as a phrase for the UI: "Confianza media" or the no-data sentence. */
export function confidenceText(confidence: Confidence): string {
  return confidence === "Sin datos" ? NO_ACCURACY_TEXT : `Confianza ${confidence.toLowerCase()}`;
}
