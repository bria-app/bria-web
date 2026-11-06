"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChartPlaceholder } from "@/components/charts/ChartPlaceholder";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Odometer } from "@/components/ui/Odometer";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatNumber, plural, soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ForecastResultDTO } from "@/types/api";
import type { OverviewProduct, ProductDiagnostics } from "@/types/forecasting";
import { ACTIONS, confidenceText, decide, isToBuy } from "./decisions";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { HorizonChart, type ChartScrub } from "./horizon/HorizonChart";
import { seriesFromResults } from "./horizon/series";
import { ProductTracking } from "./ProductTracking";
import { ACCURACY_CAVEAT, approx, historyLabel, horizonLabel, methodName } from "./labels";

const CHART_HEIGHT = 260;
/** Legend and «Reciente / Toda» row (52 px) above the chart. */
const HEADER_HEIGHT = 52;
const NO_POSITION = () => undefined;

// The engine's evidence (expert view) needs its extra series and marks: recharts loads then.
const ForecastDrilldownChart = dynamic(() => import("./ForecastDrilldownChart").then((m) => m.ForecastDrilldownChart), {
  ssr: false,
  loading: () => <ChartPlaceholder height={CHART_HEIGHT + HEADER_HEIGHT} />,
});

interface ModalProps {
  companyId: string;
  runId: string;
  horizonDays: number;
  /** The product to show; null keeps the dialog closed. */
  product: OverviewProduct | null;
  result: ForecastResultDTO | undefined;
  diag: ProductDiagnostics | undefined;
  periods: number;
  expert: boolean;
  onClose: () => void;
  /** Where it sits in the list, to go on to the next one without closing. */
  position: { at: number; of: number } | null;
  onStep: (by: number) => void;
}

const TINT: Record<string, string> = {
  danger: "bg-danger-soft",
  warning: "bg-warning-soft",
  success: "bg-success-soft",
  accent: "bg-primary-soft",
  neutral: "bg-surface-soft",
};

/** One product of a run: what to do about it first, then why, then how it is going. */
export function ProductForecastModal(props: ModalProps) {
  const { product: p, expert, onClose, position, onStep } = props;
  const buy = p && isToBuy(p);
  return (
    <Modal
      open={p != null}
      onClose={onClose}
      size="xl"
      title={p?.name ?? ""}
      description={p ? `${p.status === "skipped" ? "Sin pronóstico" : methodName(p.model_used, expert)} · ${historyLabel(props.periods, p.frequency)} de ventas` : undefined}
      footer={
        p && (
          <>
            {position && position.of > 1 && (
              <div className="mr-auto flex items-center gap-1">
                <button type="button" aria-label="Producto anterior" onClick={() => onStep(-1)} className="grid h-11 w-11 place-items-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-surface-soft">
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Producto siguiente" onClick={() => onStep(1)} className="grid h-11 w-11 place-items-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-surface-soft">
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </button>
                <span className="ml-2 hidden font-mono text-[13px] text-text-muted sm:inline">
                  {position.at + 1} de {position.of}
                </span>
              </div>
            )}
            <Link href={`/inventory/${p.product_id}`} className="btn btn-secondary h-11 px-4 text-sm">
              Ver ficha
            </Link>
            {buy ? (
              <Link href={`/purchases/new?product=${p.product_id}&cantidad=${Math.ceil(p.suggested_qty)}`} className="btn btn-strong h-11 px-4 text-sm" data-autofocus>
                Comprar {formatNumber(Math.ceil(p.suggested_qty))} u
              </Link>
            ) : (
              <Button variant="strong" onClick={onClose} data-autofocus>
                Listo
              </Button>
            )}
          </>
        )
      }
    >
      {p && (
        // A new product starts over: its answer rises in and its line draws itself.
        <div
          onKeyDown={(e) => {
            if ((e.target as HTMLElement).getAttribute("role") === "slider" || !position || position.of < 2) return;
            if (e.key === "ArrowRight") onStep(1);
            if (e.key === "ArrowLeft") onStep(-1);
          }}
        >
          <ProductDetail key={p.product_id} {...props} product={p} />
        </div>
      )}
    </Modal>
  );
}

/** How long what is on the shelf lasts, against how long an order takes to arrive. */
function Runway({ product: p, cover }: { product: OverviewProduct; cover: number | null }) {
  if (cover == null && p.on_hand > 0) return null;
  const days = p.on_hand <= 0 ? 0 : (cover ?? 0);
  const lead = p.lead_time_days;
  const scale = Math.max(30, lead + 14, Math.min(days, 120));
  const late = days < lead;
  const tight = !late && days < lead + 14;
  return (
    <section aria-label="Cuánto te alcanza" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold text-text-primary">
          {p.on_hand <= 0 ? "Se te acabó" : days > 90 ? "Te alcanza para más de 3 meses" : `Te alcanza para unos ${plural(Math.round(days), "día", "días")}`}
        </h3>
        <p className="text-[13px] text-text-secondary">
          {late
            ? `Si pides hoy, llega cuando ya no te quede: faltarían unos ${plural(Math.round(lead - days), "día", "días")}.`
            : tight
              ? "Si pides hoy, llega a tiempo, pero justo."
              : "Si pides hoy, llega con holgura."}
        </p>
      </div>
      <div className="relative h-3 rounded-full bg-surface-muted">
        <div
          className={cn("acc-fill absolute inset-y-0 left-0 rounded-full", late ? "bg-danger" : tight ? "bg-warning" : "bg-success")}
          style={{ width: `${Math.max(p.on_hand <= 0 ? 0 : 2, Math.min(100, (days / scale) * 100))}%` }}
        />
        <div aria-hidden className="absolute -inset-y-1 w-0.5 rounded-full bg-text-primary" style={{ left: `${Math.min(100, (lead / scale) * 100)}%` }} />
      </div>
      <p className="relative h-4 text-[12px] text-text-muted">
        <span className="absolute left-0">Hoy</span>
        <span
          className="absolute whitespace-nowrap font-medium text-text-secondary"
          style={lead / scale > 0.6 ? { right: `${100 - (lead / scale) * 100}%` } : { left: `${(lead / scale) * 100}%` }}
        >
          Tu proveedor demora {plural(lead, "día", "días")}
        </span>
      </p>
    </section>
  );
}

function ProductDetail({
  companyId,
  runId,
  horizonDays,
  product: p,
  result,
  diag,
  expert,
}: ModalProps & { product: OverviewProduct }) {
  const skipped = p.status === "skipped";
  const decision = skipped ? null : decide(p);
  const action = decision ? ACTIONS[decision.action] : null;
  const buy = isToBuy(p);
  const still = useReducedMotion();
  const [scrub, setScrub] = useState<ChartScrub | null>(null);
  const series = useMemo(() => (result ? seriesFromResults([result], [p]) : null), [result, p]);
  const weekly = series?.frequency === "weekly";

  return (
    <div className="space-y-6">
      {skipped ? (
        <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">
          {p.fallback_reason ?? "No hubo ventas suficientes para pronosticar este producto."}
        </p>
      ) : (
        decision &&
        action && (
          <div className={cn("rise-in flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-3xl p-5 sm:p-6", TINT[action.tone] ?? "bg-surface-soft")}>
            <div className="min-w-0 flex-[1_1_320px] space-y-1.5">
              <p className="font-display text-[28px] font-bold leading-tight tracking-[-0.025em] text-text-primary sm:text-[32px]">{action.title}</p>
              <p className="text-[15px] leading-relaxed text-text-secondary">{decision.sentence}</p>
            </div>
            {buy && (
              <div className="shrink-0 text-right">
                <p className="font-mono text-[34px] font-semibold leading-none tracking-[-0.03em] text-text-primary">
                  <Odometer value={Math.ceil(p.suggested_qty)} format={(n) => formatNumber(Math.round(n))} /> u
                </p>
                <p className="mt-1.5 text-sm text-text-secondary">≈ {soles(p.suggested_investment)}</p>
              </div>
            )}
          </div>
        )
      )}

      {!skipped && <Runway product={p} cover={decision?.coverDays ?? null} />}

      {result && result.points.length > 0 && series && (
        <section aria-label="Sus ventas y lo que viene" className="flex flex-col gap-2">
          {expert ? (
            <ForecastDrilldownChart result={result} frequency={p.frequency} simple={false} height={CHART_HEIGHT} />
          ) : (
            <>
              <p className="min-h-[26px] font-display text-[17px] font-semibold tracking-[-0.01em] text-text-primary">
                {scrub ? (
                  <>
                    {weekly ? "La semana del" : "En"} {scrub.point.label} {scrub.future ? "venderías unas" : "vendiste"}{" "}
                    <span className={cn("font-mono", scrub.future && "text-accent-text")}>{formatNumber(Math.round(scrub.point.value))} u</span>
                    {scrub.future && scrub.point.lo != null && scrub.point.hi != null && (
                      <span className="ml-2 font-sans text-[13.5px] font-normal text-text-secondary">
                        entre {formatNumber(Math.round(scrub.point.lo))} y {formatNumber(Math.round(scrub.point.hi))}
                      </span>
                    )}
                  </>
                ) : (
                  "Lo que vendió y lo que viene"
                )}
              </p>
              <HorizonChart
                series={series}
                pendingPeriods={1}
                rehearsal={null}
                settle={false}
                onSettled={NO_POSITION}
                onScrub={setScrub}
                interactive
                still={still}
                className="h-[290px]"
              />
            </>
          )}
        </section>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label={p.frequency === "weekly" ? "Próxima semana" : "Próximo mes"} value={skipped ? "—" : `${approx(p.next_period_units)} u`} />
        <Fact label={`En ${horizonLabel(horizonDays)}`} value={skipped ? "—" : `${approx(p.total_forecast_units)} u`} />
        <Fact label="Tienes hoy" value={`${formatNumber(p.on_hand)} u`} />
        <Fact label="Cuánto fiarte" value={p.accuracy_pct != null ? `${formatNumber(Math.round(p.accuracy_pct))} %` : "Sin medir"} />
      </dl>

      {!skipped && decision && (
        <p className="text-xs text-text-muted">
          {confidenceText(decision.confidence)}
          {p.accuracy_pct != null && ` · acertó ${formatNumber(p.accuracy_pct)} % (${ACCURACY_CAVEAT})`}.
        </p>
      )}

      {!skipped && (
        <section aria-label="Cómo va" className="space-y-3 border-t border-border pt-5">
          <h3 className="font-semibold text-text-primary">¿Cómo va?</h3>
          <ProductTracking companyId={companyId} runId={runId} productId={p.product_id} expert={expert} />
        </section>
      )}

      {expert && (
        <section aria-label="Detalle técnico" className="space-y-3 border-t border-border pt-5">
          <h3 className="font-semibold text-text-primary">Qué decidió el motor y por qué</h3>
          {p.fallback_reason && !skipped && (
            <p className="rounded-xl bg-warning-soft px-4 py-2.5 text-xs text-warning">{p.fallback_reason}</p>
          )}
          <DiagnosticsPanel diag={diag} orderSelected={p.order_selected} />
        </section>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-soft px-3 py-2.5">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold text-text-primary">{value}</dd>
    </div>
  );
}
