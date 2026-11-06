"use client";

import { ArrowRight, History, ShoppingBag, TrendingUp, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { formatNumber, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OverviewProduct, RunOverview } from "@/types/forecasting";
import { confidenceText, decide, isToBuy, urgencyRank } from "./decisions";
import type { HorizonSeries } from "./horizon/series";
import type { ResultTab } from "./ForecastResults";

function Tile({
  icon: Icon,
  label,
  value,
  text,
  cta,
  onClick,
  accent,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  text: string;
  cta: string;
  onClick: () => void;
  accent?: boolean;
  delay: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rise-in group flex h-full flex-col gap-1.5 rounded-2xl border p-4 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 sm:p-5",
        accent ? "border-primary/50 bg-primary-soft/60 hover:border-primary" : "border-border bg-surface hover:border-text-muted/40",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
        <Icon aria-hidden className="h-4 w-4 text-accent-text" /> {label}
      </span>
      <span className="font-mono text-[26px] font-semibold leading-tight tracking-[-0.03em] text-text-primary">{value}</span>
      <span className="text-[13.5px] leading-snug text-text-secondary">{text}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-semibold text-accent-text">
        {cta} <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

/** «1 % más que los 3 meses anteriores», against the same number of past periods. */
function againstPast(series: HorizonSeries | null): { value: string; text: string } | null {
  if (!series || series.future.length === 0 || series.past.length < series.future.length) return null;
  const n = series.future.length;
  const ahead = series.future.reduce((t, p) => t + p.value, 0);
  const before = series.past.slice(-n).reduce((t, p) => t + p.value, 0);
  const weeks = series.frequency === "weekly";
  const span = n === 1 ? (weeks ? "la semana anterior" : "el mes anterior") : `${weeks ? "las" : "los"} ${n} ${weeks ? "semanas anteriores" : "meses anteriores"}`;
  if (before <= 0) return { value: `≈ ${formatNumber(Math.round(ahead))} u`, text: "Aún no hay ventas de antes con qué compararlo." };
  const change = Math.round(((ahead - before) / before) * 100);
  return {
    value: `≈ ${formatNumber(Math.round(ahead))} u`,
    text:
      Math.abs(change) < 2
        ? `Casi lo mismo que en ${span} (${formatNumber(Math.round(before))} u).`
        : `${Math.abs(change)} % ${change > 0 ? "más" : "menos"} que en ${span} (${formatNumber(Math.round(before))} u).`,
  };
}

/**
 * The answer, explained in words and in the order someone would ask: what comes, what to do about
 * it, what is changing and how far to trust it. Each one opens the part with the detail. Figures
 * are this run's (the same the tabs show).
 */
export function ResultSummary({
  overview,
  products,
  series,
  onTab,
}: {
  overview: RunOverview;
  products: OverviewProduct[];
  series: HorizonSeries | null;
  onTab: (tab: ResultTab) => void;
}) {
  const active = products.filter((p) => p.status !== "skipped");
  const buy = products.filter(isToBuy).sort((a, b) => urgencyRank(a) - urgencyRank(b));
  const invest = buy.reduce((t, p) => t + (p.suggested_investment ?? 0), 0);
  const accuracy = overview.summary.accuracy_pct;
  const ahead = againstPast(series);

  const first = buy[0];
  const firstWhy = first ? decide(first) : null;
  const firstCover = firstWhy?.coverDays;
  const buyText = !first
    ? "Con tu inventario de hoy te alcanza para lo que viene."
    : `Lo primero: ${first.name}${first.on_hand <= 0 ? ", que ya se agotó." : firstCover != null ? `: te alcanza para unos ${firstCover} días y tu proveedor demora ${first.lead_time_days}.` : "."}`;

  // Same line as each product's advice: a quarter up or down is a real change.
  const up = active.filter((p) => (p.trend_pct ?? 0) >= 25).sort((a, b) => (b.trend_pct ?? 0) - (a.trend_pct ?? 0));
  const down = active.filter((p) => (p.trend_pct ?? 0) <= -25).sort((a, b) => (a.trend_pct ?? 0) - (b.trend_pct ?? 0));
  const moves =
    up.length + down.length === 0
      ? "Tus productos se venden parecido a los últimos meses."
      : [
          up[0] && `Sube más: ${up[0].name} (+${Math.round(up[0].trend_pct ?? 0)} %).`,
          down[0] && `Baja más: ${down[0].name} (${Math.round(down[0].trend_pct ?? 0)} %).`,
        ]
          .filter(Boolean)
          .join(" ");
  const movesValue =
    up.length + down.length === 0 ? "Sin cambios" : [up.length > 0 && `${up.length} ${up.length === 1 ? "sube" : "suben"}`, down.length > 0 && `${down.length} ${down.length === 1 ? "baja" : "bajan"}`].filter(Boolean).join(" · ");

  const trust =
    accuracy == null
      ? "Aún no hay ventas suficientes para medirlo."
      : `${confidenceText(accuracy >= 75 ? "Alta" : accuracy >= 55 ? "Media" : "Baja")}: lo probamos escondiendo tus últimos meses. Puede ser optimista.`;

  return (
    <section aria-label="Resumen del pronóstico" data-look="next" className="space-y-3">
      <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-text-primary">En resumen</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={TrendingUp}
          label="Qué viene"
          value={ahead?.value ?? "—"}
          text={ahead?.text ?? "Sin pronóstico para este grupo."}
          cta="Ver por producto"
          onClick={() => onTab("pron")}
          delay={60}
        />
        <Tile
          icon={ShoppingBag}
          label="Qué comprar"
          value={buy.length ? soles(invest) : "Nada por ahora"}
          text={buy.length ? `${buy.length} ${buy.length === 1 ? "producto" : "productos"}. ${buyText}` : buyText}
          cta="Ver la lista"
          onClick={() => onTab("comprar")}
          accent={buy.length > 0}
          delay={120}
        />
        <Tile icon={Waves} label="Qué está cambiando" value={movesValue} text={moves} cta="Ver por producto" onClick={() => onTab("pron")} delay={180} />
        <Tile
          icon={History}
          label="Cuánto fiarte"
          value={accuracy != null ? <CountUp value={accuracy} format={(n) => `${Math.round(n)} %`} /> : "—"}
          text={trust}
          cta="Compruébalo con tu pasado"
          onClick={() => onTab("acierto")}
          delay={240}
        />
      </div>
    </section>
  );
}
