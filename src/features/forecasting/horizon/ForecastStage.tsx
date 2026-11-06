"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Odometer } from "@/components/ui/Odometer";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ForecastConfig, LONG_HORIZON_DAYS, type ForecastConfigProps } from "../ForecastConfig";
import { isToBuy } from "../decisions";
import { forWhen, historyLabel } from "../labels";
import type { OverviewProduct, PreviewTotals, RunOverview } from "@/types/forecasting";
import { HorizonChart, READ_MS, type ChartScrub } from "./HorizonChart";
import type { HorizonSeries, RehearsalPass } from "./series";

const units = (n: number) => formatNumber(Math.round(n));
/** A long run: from here on, say it can be left working. */
const PATIENCE_MS = 9000;
/** How long the real choice stays on screen before the result. */
const CHOICE_MS = 1900;
const STEPS = ["Leer", "Ensayar", "Elegir", "Listo"];

/** Where the calculation is. Not a percentage: the API doesn't report one. */
function StageSteps({ at }: { at: number }) {
  return (
    <ol aria-hidden className="hidden items-center gap-2 text-[12px] font-medium md:flex">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          {i > 0 && <span className={cn("h-px w-5 transition-colors duration-500", i <= at ? "bg-primary" : "bg-border")} />}
          <span className={cn("flex items-center gap-1.5 transition-colors duration-300", i === at ? "text-text-primary" : i < at ? "text-text-secondary" : "text-text-muted")}>
            <span className={cn("h-2 w-2 rounded-full transition-colors duration-300", i <= at ? "bg-primary" : "bg-surface-muted", i === at && "stage-step-on")} />
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Each word of a sentence rises in turn. `from` continues the count of the words before it. */
function Rise({ text, from = 0 }: { text: string; from?: number }) {
  // The space stays outside the word: at the end of an inline-block it would collapse.
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="word-rise" style={{ "--i": from + i } as React.CSSProperties}>
        {w}
      </span>{" "}
    </Fragment>
  ));
}

function buyPhrase(products: OverviewProduct[]): string {
  const buy = products.filter(isToBuy);
  if (buy.length === 0) return "Con lo que tienes te alcanza por ahora.";
  const urgent = buy.filter((p) => p.stockout_risk === "alto" || p.on_hand <= 0).length;
  return `Te conviene reponer ${buy.length} ${buy.length === 1 ? "producto" : "productos"}${urgent > 0 ? `, ${urgent} con urgencia` : ""}.`;
}

/** Headline, at the size everything in this block shares. */
function Headline({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("max-w-4xl font-display text-[24px] font-bold leading-[1.18] tracking-[-0.025em] text-text-primary sm:text-[30px]", className)}>{children}</p>;
}

/** Which method won, in how many products: the engine's own count. */
export interface StageTally {
  total: number;
  methods: { name: string; count: number }[];
}

export interface StageAnswer {
  overview: RunOverview;
  horizonDays: number;
  runId: string;
}

/**
 * Pronóstico's one stage: the sentence that asks, and below it one line that goes through the
 * shop's real past, today and what comes. The same drawing is the invitation, the calculation and
 * the answer, so nothing is swapped on screen: the past stays where it is and the result grows
 * out of today.
 */
export function ForecastStage({
  config,
  series,
  pendingPeriods,
  rehearsal,
  calculating,
  settle,
  onSettled,
  answer,
  backTo,
  totals,
  still,
  tally,
}: {
  config: ForecastConfigProps;
  series: HorizonSeries | null;
  pendingPeriods: number;
  rehearsal: RehearsalPass[] | null;
  /** The engine is working, or its result is being landed. */
  calculating: boolean;
  settle: boolean;
  onSettled: () => void;
  /** The finished run on screen. Null: nothing calculated for what the sentence asks. */
  answer: StageAnswer | null;
  /** The sentence was changed: how to go back to the result still showing below. */
  backTo: { label: string; go: () => void } | null;
  totals: PreviewTotals | null;
  still: boolean;
  /** Ready once the engine has finished. */
  tally: StageTally | null;
}) {
  const router = useRouter();
  const [scrub, setScrub] = useState<ChartScrub | null>(null);
  const [lastScrub, setLastScrub] = useState<ChartScrub | null>(null);
  if (scrub && scrub !== lastScrub) setLastScrub(scrub);
  const [pass, setPass] = useState<RehearsalPass | null>(null);

  // What the wait is about: reading, then rehearsing, and past a while, that it can be left alone.
  const [reading, setReading] = useState(false);
  const [patience, setPatience] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [wasCalculating, setWasCalculating] = useState(false);
  if (calculating !== wasCalculating) {
    setWasCalculating(calculating);
    setReading(calculating);
    setPatience(false);
    setChoosing(false);
  }
  // The rehearsal is over and the engine has its answer: show what it chose, then the result.
  const chartSettled = () => {
    if (tally && tally.methods.length > 0 && !still) setChoosing(true);
    else onSettled();
  };
  useEffect(() => {
    if (!choosing) return;
    const id = window.setTimeout(onSettled, CHOICE_MS);
    return () => window.clearTimeout(id);
  }, [choosing, onSettled]);
  useEffect(() => {
    if (!calculating) return;
    const a = window.setTimeout(() => setReading(false), READ_MS);
    const b = window.setTimeout(() => setPatience(true), PATIENCE_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [calculating]);

  const totalUnits = answer?.overview.summary.total_forecast_units ?? 0;
  const inWhen = answer ? forWhen(answer.horizonDays).replace(/^para /, "En ") : "";
  const headWords = `${inWhen} venderás unas`.split(" ").length;
  const shown = scrub ?? lastScrub;
  const scrubbing = !!scrub && !calculating;
  const weekly = series?.frequency === "weekly";
  const when = shown ? `${weekly ? "La semana del" : "En"} ${shown.point.label}` : "";
  // Nothing sold in what the sentence asks about: there is no line to draw, so no chart to frame.
  const noSales = !calculating && !answer && !config.preview.loading && !config.preview.error && series?.past.length === 0;
  const canCalculate = (totals?.products_included ?? 0) > 0;

  return (
    <section aria-label="Pronóstico" className="relative z-10 rounded-[28px] border border-border bg-surface">
      {/* Clipped on its own layer: the sentence's choices open menus that must overflow the card. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div className="tm-grid tm-grid-soft absolute inset-0" />
      </div>

      <div className="relative flex flex-col">
        <div className="relative z-20 border-b border-border px-5 py-4 sm:px-7 sm:py-5">
          <div data-look="ask">
            <ForecastConfig {...config} />
          </div>
        </div>

        {noSales ? (
          <div className="stage-swap flex flex-col items-start gap-3 p-5 sm:p-7">
            <Headline>Cuando tengas ventas, aquí verás lo que viene.</Headline>
            <p className="max-w-2xl text-sm text-text-secondary">Sube tus ventas pasadas y bria. proyecta desde el primer día. Cada venta nueva lo afina.</p>
            <Button variant="secondary" className="mt-1" onClick={() => router.push("/sales?tab=imported")}>
              Subir mis ventas
            </Button>
          </div>
        ) : (
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          {/* The states share one cell, so going from one to another never moves the chart. */}
          <div className="relative min-h-[84px] sm:min-h-[104px]" aria-live="polite">
            {calculating ? (
              <div key="calc" className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <Headline key={choosing ? "c" : reading ? "r" : "e"} className="stage-swap">
                    {choosing ? "Eligiendo el mejor para cada producto" : reading || still ? "Leyendo tus ventas" : "Ensayando con tu pasado"}
                  </Headline>
                  {!still && <StageSteps at={choosing ? 2 : reading ? 0 : 1} />}
                </div>
                <p className="text-sm text-text-secondary">
                  {choosing && tally ? (
                    <>
                      «{tally.methods[0].name}» fue el que menos falló en {tally.methods[0].count} de {tally.total} {tally.total === 1 ? "producto" : "productos"}.
                    </>
                  ) : reading || still ? (
                    totals ? (
                      `${formatNumber(totals.total_units)} unidades de ${formatNumber(totals.products_included)} ${totals.products_included === 1 ? "producto" : "productos"}`
                    ) : (
                      " "
                    )
                  ) : (
                    <>
                      Escondo tus últimos meses y compruebo qué método los adivina mejor.
                      {pass && <span className="text-text-muted"> Ahora: {pass.title}.</span>}
                    </>
                  )}
                </p>
                <p className={cn("text-sm text-text-muted transition-opacity duration-500", !patience && "opacity-0")}>Puedes seguir trabajando: el resultado aparece aquí cuando esté listo.</p>
              </div>
            ) : answer ? (
              <div key={answer.runId}>
                <div className={cn("transition-opacity duration-150", scrubbing && "opacity-0")}>
                  <Headline>
                    <Rise text={`${inWhen} venderás unas`} />
                    <span className="word-rise whitespace-nowrap text-accent-text" style={{ "--i": headWords } as React.CSSProperties}>
                      <Odometer value={Math.round(totalUnits)} format={units} /> unidades.
                    </span>{" "}
                    <Rise text={buyPhrase(answer.overview.products)} from={headWords + 2} />
                  </Headline>
                  {answer.horizonDays >= LONG_HORIZON_DAYS && (
                    <p className="word-rise mt-2 max-w-4xl text-[13.5px] text-text-muted" style={{ "--i": headWords + 8 } as React.CSSProperties}>
                      Es una proyección para planificar: mientras más lejos, menos exacta. La compra sugerida usa solo los próximos días de espera del proveedor más un mes.
                    </p>
                  )}
                </div>
                <div aria-hidden={!scrubbing} className={cn("absolute inset-0 transition-opacity duration-150", scrubbing ? "opacity-100" : "pointer-events-none opacity-0")}>
                  {shown && (
                    <>
                      <Headline>
                        {when} {shown.future ? "venderías unas" : "vendiste"}{" "}
                        <span className={cn("whitespace-nowrap", shown.future && "text-accent-text")}>
                          <Odometer value={Math.round(shown.point.value)} format={units} fromStart={false} /> unidades
                        </span>
                      </Headline>
                      {shown.future && shown.point.lo != null && shown.point.hi != null && (
                        <p className="mt-1.5 text-sm text-text-secondary">
                          Rango probable: entre <span className="font-mono text-text-primary">{units(shown.point.lo)}</span> y{" "}
                          <span className="font-mono text-text-primary">{units(shown.point.hi)}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : series && series.past.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <Headline>
                  {scrubbing && shown ? (
                    <>
                      {when} vendiste{" "}
                      <span className="whitespace-nowrap">
                        <Odometer value={Math.round(shown.point.value)} format={units} fromStart={false} /> unidades
                      </span>
                    </>
                  ) : backTo ? (
                    "Esto aún no está calculado."
                  ) : (
                    <>Esto vendiste en los últimos {historyLabel(series.past.length, "monthly")}. ¿Qué viene?</>
                  )}
                </Headline>
                <p className="text-sm text-text-secondary">
                  {canCalculate ? "Toca «Calcular» y bria. lo proyecta." : "Con unas ventas más, bria. podrá proyectarlo."}
                  {backTo && (
                    <>
                      {" "}
                      <button type="button" onClick={backTo.go} className="font-semibold text-accent-text hover:underline">
                        Volver a {backTo.label}
                      </button>
                    </>
                  )}
                </p>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <HorizonChart
              series={series}
              pendingPeriods={pendingPeriods}
              rehearsal={rehearsal}
              settle={settle}
              onSettled={chartSettled}
              onPassChange={setPass}
              onScrub={setScrub}
              interactive={!calculating}
              still={still}
              // Short enough that what follows peeks in at the bottom of the screen.
              className="h-[clamp(220px,31vh,380px)]"
            />
            {choosing && tally && (
              <div className="stage-swap absolute right-2 top-6 hidden w-72 flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4 shadow-soft-lg sm:flex">
                {tally.methods.slice(0, 3).map((m, i) => (
                  <div key={m.name} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="truncate text-text-primary">{m.name}</span>
                      <span className="shrink-0 font-mono text-text-secondary">{m.count}</span>
                    </span>
                    <span className="block h-1.5 rounded-full bg-surface-muted">
                      <span
                        className={cn("acc-fill block h-1.5 rounded-full", i === 0 ? "bg-primary" : "bg-text-secondary/45")}
                        style={{ width: `${Math.max(6, Math.round((m.count / tally.total) * 100))}%`, animationDelay: `${i * 120}ms` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
