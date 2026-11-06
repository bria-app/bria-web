"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/DataState";
import { Segmented } from "@/components/ui/Segmented";
import { ftgmApi } from "@/services/api/forecasting";
import type { FtgmQuota, FtgmRun, RunTracking } from "@/types/forecasting";
import { timeAgo } from "@/lib/format";
import { isRunActive, useForecastRun } from "../useForecastRun";
import { AccuracyResult } from "./AccuracyResult";
import { REWIND_MS, TimeMachine } from "./TimeMachine";
import { limaToday, longDate, monthName, scoreBacktest, testCutoff, TEST_LENGTHS, type TestLength } from "./score";

const sameScope = (a: FtgmRun["scope"], b: FtgmRun["scope"]) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
/** Showing the comparison a moment after the engine finishes, so the last step can be read. */
const COMPARE_MS = 900;

/** Days asked to the engine for a test of `months` months (whole months, never short). */
const DAYS: Record<TestLength, number> = { 3: 90, 6: 182, 12: 365 };
type LengthKey = "3" | "6" | "12";

interface TabProps {
  companyId: string;
  run: FtgmRun;
  /** Earlier backtests, newest first. */
  backtests: FtgmRun[];
  quota: FtgmQuota | null;
  onCreated: () => void;
}

/**
 * «¿Qué tan bien acierta?»: re-runs this forecast as if it were the 1st of the month 3, 6 or 12
 * months ago and compares it with what really sold since. A real backtest (it never feeds
 * purchases); a recent one for the same products and length is reused instead of calculated again.
 */
export function AccuracyTab(props: TabProps) {
  const [length, setLength] = useState<TestLength>(3);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">¿Desde hace cuánto quieres probar?</p>
        <Segmented<LengthKey>
          label="Largo de la prueba"
          size="sm"
          value={String(length) as LengthKey}
          onChange={(v) => setLength(Number(v) as TestLength)}
          options={TEST_LENGTHS.map((m) => ({ value: String(m) as LengthKey, label: `${m} meses` }))}
        />
      </div>
      {/* Keyed by length: each test keeps its own run and animation. */}
      <AccuracyTest key={length} length={length} {...props} />
    </div>
  );
}

function AccuracyTest({ companyId, run, backtests, quota, onCreated, length }: TabProps & { length: TestLength }) {
  const today = limaToday();
  const cutoff = testCutoff(length, today);
  const previous = useMemo(
    () =>
      backtests.find(
        (b) => b.status === "success" && b.as_of === cutoff && b.horizon_days === DAYS[length] && sameScope(b.scope, run.scope),
      ) ?? null,
    [backtests, cutoff, length, run.scope],
  );
  const [testId, setTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<RunTracking | null>(null);
  const [animating, setAnimating] = useState(false);
  const [rewound, setRewound] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const runId = testId ?? previous?.id ?? null;
  const watched = useForecastRun(companyId, runId, () => onCreated());
  const test = watched.run;
  const failed = test?.status === "failed" || test?.status === "cancelled";

  // When the test run is ready, read what sold since the cut-off.
  useEffect(() => {
    if (!test || test.status !== "success") return;
    let gone = false;
    ftgmApi
      .tracking(companyId, test.id)
      .then((t) => !gone && setTracking(t))
      .catch((e: unknown) => !gone && setError(e instanceof Error ? e.message : "No se pudo leer lo vendido."));
    return () => {
      gone = true;
    };
  }, [companyId, test]);

  // Steps follow the real run (never faster than the rewind); the comparison stays a moment.
  const step = !rewound ? 0 : !tracking ? 1 : 2;
  useEffect(() => {
    if (!animating || step < 2) return;
    const t = window.setTimeout(() => setAnimating(false), COMPARE_MS);
    return () => window.clearTimeout(t);
  }, [animating, step]);

  const report = useMemo(() => (tracking && test?.as_of ? scoreBacktest(tracking, test.as_of, length) : null), [tracking, test, length]);
  const outOfQuota = quota?.remaining === 0;

  const animate = () => {
    setRewound(false);
    setAnimating(true);
    timers.current.push(window.setTimeout(() => setRewound(true), REWIND_MS));
  };
  /** The animation again over the same result: no new calculation. */
  const replay = animate;

  const start = async () => {
    setError(null);
    setTracking(null);
    animate();
    try {
      const created = await ftgmApi.createRun(companyId, {
        scope: run.scope ?? { type: "all" },
        horizon_days: DAYS[length],
        frequency: "auto",
        as_of: cutoff,
      });
      setTestId(created.id);
      onCreated();
    } catch (e) {
      setAnimating(false);
      setError(e instanceof Error ? e.message : "No se pudo empezar la prueba.");
    }
  };

  const problem = error ?? watched.error ?? (failed ? (test?.error_message ?? "La prueba no se pudo completar.") : null);

  // A problem (the run failed, or what sold could not be read) ends the animation: the card says what happened.
  if (!problem && (animating || (test && isRunActive(test)))) return <TimeMachine today={today} cutoff={cutoff} length={length} step={step} />;

  // An earlier test is being opened: wait for it instead of flashing the invitation.
  if (!problem && !report && runId && (watched.loading || test?.status === "success")) return <Skeleton />;

  if (report) {
    return (
      <div key={test?.id} className="flex flex-col gap-4">
        <AccuracyResult report={report} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <span>
            Prueba hecha {test?.completed_at ? timeAgo(test.completed_at) : "hoy"} · no cambia tus compras ni tu pronóstico de hoy.
          </span>
          <Button variant="ghost" size="sm" onClick={replay}>
            <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Ver la animación otra vez
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden className="tm-grid tm-grid-soft pointer-events-none absolute inset-0" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-text">
            <History aria-hidden className="h-4 w-4" /> ¿Le creo a bria.?
          </span>
          <h3 className="font-display text-[28px] font-bold leading-[1.08] tracking-[-0.03em] text-text-primary sm:text-[34px]">
            Pruébalo con tu pasado.
          </h3>
          <p className="max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Volvemos al <b className="text-text-primary">{longDate(cutoff)}</b>, calculamos como si fuera ese día, sin ver lo que vino después, y lo
            comparamos con lo que de verdad vendiste{" "}
            {length === 3 ? `en ${monthName(cutoff)}, ${monthName(cutoff, 1)} y ${monthName(cutoff, 2)}` : `en los ${length} meses siguientes, mes a mes`}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void start()} disabled={outOfQuota}>
              Viajar al {longDate(cutoff)} <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
            <span className="text-xs text-text-muted">
              {quota?.monthly_limit != null
                ? outOfQuota
                  ? "Usaste tus predicciones gratis de este mes."
                  : `Usa 1 de las ${quota.remaining} predicciones que te quedan este mes.`
                : "Unos segundos. No cambia tus compras."}
            </span>
          </div>
          {problem && (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {problem}
            </p>
          )}
        </div>
        {/* What the test does, at a glance. */}
        <ol aria-label="Cómo funciona la prueba" className="flex flex-col gap-2.5">
          {[
            ["Retrocede", `Tu historia hasta el ${longDate(cutoff)}`],
            ["Pronostica", `${length} meses, con los mismos métodos de siempre`],
            ["Compara", "Contra lo que vendiste en caja, mes a mes"],
          ].map(([t, d], i) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3 backdrop-blur">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-[13px] font-semibold text-accent-text">{i + 1}</span>
              <span className="flex flex-col">
                <span className="text-[14px] font-semibold text-text-primary">{t}</span>
                <span className="text-[13px] text-text-secondary">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
