"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DataState } from "@/components/ui/DataState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useExpertMode } from "@/hooks/useExpertMode";
import { usePlan } from "@/hooks/usePlan";
import { useDevicePref } from "@/hooks/useDevicePref";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { timeAgo } from "@/lib/format";
import { forecastingApi } from "@/services/api/resources";
import { ftgmApi } from "@/services/api/forecasting";
import type { FtgmRun } from "@/types/forecasting";
import { DemoModeBanner } from "./DemoModeBanner";
import { HORIZON_VALUES } from "./ForecastConfig";
import { ForecastResults, type ResultTab } from "./ForecastResults";
import { HowItWorksButton } from "./HowItWorks";
import { RunHeader } from "./RunHeader";
import { FirstLook } from "./horizon/FirstLook";
import { useForecastEntry } from "./horizon/ForecastIntro";
import { ForecastStage, type StageTally } from "./horizon/ForecastStage";
import { MoreBelow } from "./horizon/MoreBelow";
import { horizonPeriods, originsOf, productValues, seriesFromPreview, seriesFromResults, type RehearsalPass } from "./horizon/series";
import { PredictionTourModal } from "./tour/PredictionTourModal";
import { TourInvite } from "./tour/TourInvite";
import { usePredictionTourState } from "./tour/useTourState";
import { methodName } from "./labels";
import { isRunActive, useForecastRun } from "./useForecastRun";
import { scopeFromValue, useScopeOptions, valueFromScope } from "./useScopeOptions";

const LOOK_STATES = ["nuevo", "visto"] as const;

/** What the person reads when a run fails: the system's own error text is for the logs. */
function plainRunError(message: string | null | undefined): string {
  if (!message) return "El motor de pronóstico no terminó.";
  const technical = /winerror|errno|exception|traceback|connection|connect|timeout|timed out|http|refused|\[\w+\]/i.test(message);
  return technical ? "No pudimos conectar con el motor de pronóstico." : message;
}
/** How many real series a long calculation shows, one after another. */
const MAX_PASSES = 8;

/**
 * «Pronóstico»: one stage with the sentence that asks («Predice [alcance] para [horizonte]») and a
 * line through the shop's real past, today and what comes; below it, what to do about it. Deep
 * links: `?run=` opens a run, `?product=` preselects one product, `?vista=comprar` opens «Qué comprar».
 */
export function ForecastScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const companyId = useCompanyId();
  const toast = useToast();
  const [expert] = useExpertMode();
  const plan = usePlan();
  const [tourState, setTourState] = usePredictionTourState();
  const [tourOpen, setTourOpen] = useState(false);
  // Premium only: the first time, a calm invitation; afterwards just a link inside «¿Cómo funciona?».
  const [firstLook, setFirstLook] = useDevicePref("bria-pronostico-guia", LOOK_STATES, "nuevo");
  const invite = !plan.loading && plan.isPremium && tourState === "nuevo" && firstLook === "visto";
  const openTour = () => {
    setTourState("visto");
    setTourOpen(true);
  };

  const runParam = search.get("run");
  const vista = search.get("vista");
  const legacyView = vista === "numeros" || vista === "reportes";
  useEffect(() => {
    if (legacyView) router.replace("/reports");
  }, [legacyView, router]);

  const [tab, setTab] = useState<ResultTab>(vista === "comprar" ? "comprar" : vista === "acierto" ? "acierto" : "pron");
  // Null: the sentence says what the result on screen is about.
  const [scopeChoice, setScopeChoice] = useState<string | null>(null);
  const [horizonChoice, setHorizonChoice] = useState<string | null>(null);
  const [chosenRun, setChosenRun] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const quota = useApi(() => (companyId ? ftgmApi.quota(companyId).catch(() => null) : Promise.resolve(null)), [companyId]);
  // Tests against the past («Qué tan bien acierta») are not forecasts to act on: they come from
  // their own list, so a burst of tests never pushes real runs out of «Ver otro cálculo».
  const runs = useApi(
    () => (companyId ? ftgmApi.listRuns(companyId, 20, false) : Promise.resolve([] as FtgmRun[])),
    [companyId],
  );
  const tests = useApi(
    () => (companyId ? ftgmApi.listRuns(companyId, 20, true) : Promise.resolve([] as FtgmRun[])),
    [companyId],
  );
  const reloadRuns = () => {
    runs.reload();
    tests.reload();
  };

  const finished = (runs.data ?? []).filter((r) => r.status === "success" && !r.is_backtest);
  const backtests = (tests.data ?? []).filter((r) => r.is_backtest);
  const runId = chosenRun ?? runParam ?? finished[0]?.id ?? null;

  const still = useReducedMotion();
  // Everything draws itself as the entry curtain leaves, not behind it.
  const { ready, contentReady } = useForecastEntry();
  // The run whose calculation is on screen, from its start until its result has landed.
  const [rehearsing, setRehearsing] = useState<string | null>(null);

  const watched = useForecastRun(companyId, runId, (r) => {
    reloadRuns();
    quota.reload();
    if (r.status === "success") router.replace(`/forecasting?run=${r.id}`, { scroll: false });
  });
  const run = watched.run;
  const calculating = isRunActive(run);
  // Also when arriving at a run already under way.
  if (calculating && run && rehearsing !== run.id) setRehearsing(run.id);
  // The rehearsal starts with the click: the request itself can take as long as the calculation.
  const inRehearsal = starting || (!!runId && rehearsing === runId);

  const productParam = search.get("product");
  const runScope = run ? valueFromScope(run.scope) : null;
  const runProduct = run?.scope?.type === "products" ? (run.scope.product_ids?.[0] ?? null) : null;
  const { options, defaultValue } = useScopeOptions(companyId, productParam, runProduct);
  const runHorizon = run && HORIZON_VALUES.includes(String(run.horizon_days)) ? String(run.horizon_days) : null;
  // A deep link to a product asks about that product, whatever was calculated last.
  const scope = scopeChoice ?? (productParam ? defaultValue : (runScope ?? defaultValue));
  const horizon = horizonChoice ?? runHorizon ?? "30";

  const preview = useApi(
    () => (companyId ? ftgmApi.previewScope(companyId, { scope: scopeFromValue(scope) }) : Promise.resolve(null)),
    [companyId, scope],
  );

  // The result's data lives here because the stage lands on it.
  const doneId = run?.status === "success" ? run.id : null;
  const overview = useApi(() => (companyId && doneId ? ftgmApi.overview(companyId, doneId) : Promise.resolve(null)), [companyId, doneId]);
  const results = useApi(() => (companyId && doneId ? forecastingApi.runResults(companyId, doneId) : Promise.resolve(null)), [companyId, doneId]);
  const ov = overview.data && overview.data.run.id === doneId ? overview.data : null;
  const resultRows = !overview.loading && !results.loading && results.data ? results.data : null;
  const dataReady = !!ov && !!resultRows;

  // Did the sentence move away from the result on screen?
  const changed = !!run && !calculating && !starting && run.status === "success" && (scope !== runScope || horizon !== String(run.horizon_days));

  const previewSeries = useMemo(
    () => (preview.data ? seriesFromPreview(preview.data.products, preview.data.totals.as_of) : null),
    [preview.data],
  );
  const resultSeries = useMemo(() => (ov && resultRows ? seriesFromResults(resultRows, ov.products) : null), [ov, resultRows]);
  const landed = !!run && run.status === "success" && !inRehearsal && !changed;
  const series = landed ? resultSeries : previewSeries;
  useEffect(() => {
    if (series || runs.error || overview.error || results.error || preview.error) contentReady();
  }, [series, runs.error, overview.error, results.error, preview.error, contentReady]);

  // What the rehearsal plays: everything in the sentence, then its best sellers, on real sales.
  const scopeTitle = options.find((o) => o.value === scope)?.label ?? "Lo que elegiste";
  const passes = useMemo<RehearsalPass[] | null>(() => {
    if (!inRehearsal || still || !previewSeries) return null;
    const out: RehearsalPass[] = [];
    const whole = previewSeries.past;
    if (originsOf(whole.length).length > 0) out.push({ title: scopeTitle, points: whole });
    const products = preview.data?.products ?? [];
    if (products.length > 1) {
      [...products]
        .filter((p) => p.included)
        .sort((a, b) => b.total_units - a.total_units)
        .slice(0, MAX_PASSES)
        .forEach((p) => {
          const points = productValues(p, preview.data?.totals.as_of);
          if (originsOf(points.length).length > 0 && points.some((x) => x.value > 0)) out.push({ title: p.name, points });
        });
    }
    return out.length ? out : null;
  }, [inRehearsal, still, previewSeries, preview.data, scopeTitle]);

  const settle = inRehearsal && !starting && !!run && !calculating && (run.status !== "success" || dataReady);
  const doneCount = run?.product_count ?? 0;
  const doneOk = run?.status === "success";
  const onSettled = useCallback(() => {
    setRehearsing(null);
    if (doneOk) toast(`Pronóstico listo: ${doneCount} ${doneCount === 1 ? "producto" : "productos"}`);
  }, [doneOk, doneCount, toast]);

  // The engine's own count of which method won, for the moment before the result.
  const tally = useMemo<StageTally | null>(() => {
    if (!ov) return null;
    const counted = ov.products.filter((p) => p.status !== "skipped");
    const by = new Map<string, number>();
    for (const p of counted) {
      const name = methodName(p.model_used, expert);
      by.set(name, (by.get(name) ?? 0) + 1);
    }
    return { total: counted.length, methods: [...by.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count) };
  }, [ov, expert]);

  const calculate = async () => {
    if (!companyId) return;
    setStarting(true);
    setLaunchError(null);
    try {
      const created = await ftgmApi.createRun(companyId, {
        scope: scopeFromValue(scope),
        horizon_days: Number(horizon),
        frequency: "auto",
      });
      setChosenRun(created.id);
      setRehearsing(created.id);
      setScopeChoice(null);
      setHorizonChoice(null);
      setTab("pron");
      runs.reload();
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "No se pudo empezar el cálculo. Inténtalo de nuevo.");
    } finally {
      setStarting(false);
      quota.reload();
    }
  };

  const pick = (id: string) => {
    setChosenRun(id);
    setScopeChoice(null);
    setHorizonChoice(null);
    router.replace(`/forecasting?run=${id}`, { scroll: false });
  };

  const latestAt = finished[0]?.completed_at ?? finished[0]?.created_at ?? null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Pronóstico"
        description="Cuánto vas a vender y qué te conviene comprar, calculado con tus ventas pasadas."
        action={<HowItWorksButton onShortTour={plan.isPremium ? openTour : undefined} />}
      />

      <DemoModeBanner />

      <PredictionTourModal open={tourOpen} onClose={() => setTourOpen(false)} />

      <ForecastStage
        config={{
          scopeOptions: options,
          scope,
          onScope: setScopeChoice,
          horizon,
          onHorizon: setHorizonChoice,
          onCalculate: () => void calculate(),
          calculating: calculating || inRehearsal,
          starting,
          preview: { loading: preview.loading, totals: preview.data?.totals ?? null, error: preview.error },
          quota: quota.data,
          lastRunAt: latestAt,
        }}
        series={ready ? series : null}
        pendingPeriods={horizonPeriods(Number(horizon))}
        rehearsal={passes}
        calculating={calculating || inRehearsal}
        settle={settle}
        onSettled={onSettled}
        tally={tally}
        answer={ready && landed && ov && run ? { overview: ov, horizonDays: run.horizon_days, runId: run.id } : null}
        backTo={
          changed && run
            ? {
                label: `lo calculado ${timeAgo(run.completed_at ?? run.created_at ?? "")}`,
                go: () => {
                  setScopeChoice(null);
                  setHorizonChoice(null);
                },
              }
            : null
        }
        totals={preview.data?.totals ?? null}
        still={still}
      />

      {/* After the stage: what arrives on this screen first is the shop's own line. */}
      {invite && <TourInvite onOpen={openTour} onDismiss={() => setTourState("visto")} />}

      {launchError && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {launchError}
        </p>
      )}

      {ready && firstLook === "nuevo" && series && series.past.length > 0 && (!run || (landed && dataReady)) && !tourOpen && (
        <FirstLook hasResult={!!run && landed && dataReady} onDone={() => setFirstLook("visto")} />
      )}
      {ready && landed && dataReady && firstLook === "visto" && <MoreBelow label="Ver qué hacer con esto" />}

      <DataState
        loading={!ready || !companyId || (runs.loading && !runs.data) || watched.loading || (landed && !dataReady && !overview.error && !results.error)}
        error={runs.error ?? watched.error ?? overview.error ?? results.error}
        onRetry={() => {
          runs.reload();
          watched.reload();
          overview.reload();
          results.reload();
        }}
      >
        {!run || inRehearsal || calculating ? null : run.status !== "success" ? (
          <Card className="space-y-1">
            <p className="font-semibold text-text-primary">Este cálculo no se pudo completar</p>
            <p className="text-sm text-text-secondary">
              {plainRunError(run.error_message)} Prueba con otro grupo de productos o vuelve a calcular.
            </p>
          </Card>
        ) : (
          companyId &&
          ov &&
          resultRows && (
            // Keyed by run: a fresh result rises in when the stage lands on it (or another run is picked).
            <div key={run.id} className="rise-in space-y-4">
              <RunHeader run={run} runs={finished} onPick={pick} expert={expert} />
              <ForecastResults
                companyId={companyId}
                run={run}
                tab={tab}
                onTab={setTab}
                expert={expert}
                backtests={backtests}
                quota={quota.data}
                onBacktest={() => {
                  tests.reload();
                  quota.reload();
                }}
                overview={ov}
                results={resultRows}
                series={resultSeries}
                onReload={overview.reload}
              />
            </div>
          )
        )}
      </DataState>
    </div>
  );
}
