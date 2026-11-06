"use client";

import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type AccuracyReport, longDate, monthName, observations, toneLabel, toneOf, type Tone } from "./score";

const TONE_TEXT: Record<Tone, string> = { good: "text-success", near: "text-warning", far: "text-danger" };
const TONE_CHIP: Record<Tone, string> = { good: "bg-success-soft text-success", near: "bg-warning-soft text-warning", far: "bg-danger-soft text-danger" };
const TONE_BAR: Record<Tone, string> = { good: "bg-success", near: "bg-warning", far: "bg-danger" };

/** A ring that fills to the accuracy, with the figure counting up in the middle. */
function Ring({ value, delay }: { value: number | null; delay: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const tone = toneOf(value);
  return (
    <div className="relative grid h-[84px] w-[84px] place-items-center sm:h-36 sm:w-36">
      <svg viewBox="0 0 108 108" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="54" cy="54" r={r} fill="none" strokeWidth="9" className="stroke-surface-muted" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className={cn("acc-ring", tone === "good" ? "stroke-success" : tone === "near" ? "stroke-warning" : "stroke-danger")}
          style={{ strokeDasharray: c, ["--ring-to" as string]: c * (1 - (value ?? 0) / 100), animationDelay: `${delay}ms` }}
        />
      </svg>
      <span className="font-mono text-[19px] font-semibold tracking-[-0.04em] text-text-primary sm:text-[30px]">
        {value == null ? "—" : <CountUp value={value} format={(n) => `${Math.round(n)}%`} duration={1100} />}
      </span>
    </div>
  );
}

/** Units sold each month after the cut-off (bar) and what bria. had said (marker). */
function MonthBars({ months }: { months: AccuracyReport["months"] }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.actual, m.forecast])) * 1.12;
  const many = months.length > 6;
  return (
    <div
      className={cn("grid h-52 items-end", many ? "gap-1.5 sm:gap-2.5" : "gap-4 sm:gap-8")}
      style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
    >
      {months.map((m, i) => {
        // Nothing sold that month: a percentage of zero says nothing.
        const diff = m.actual > 0 ? ((m.forecast - m.actual) / m.actual) * 100 : null;
        return (
          <div key={m.label} className="flex h-full flex-col items-center justify-end gap-2">
            {!many && (
              <span className="font-mono text-[12px] text-text-muted">
                {diff == null ? "—" : `${diff >= 0 ? "+" : "−"}${formatNumber(Math.abs(diff), 0)} %`}
              </span>
            )}
            <div className="relative w-full max-w-[120px] flex-1">
              <span
                className="acc-bar absolute inset-x-0 bottom-0 rounded-t-xl bg-text-primary/12"
                style={{ height: `${(m.actual / max) * 100}%`, animationDelay: `${200 + i * 140}ms` }}
              />
              <span
                className={cn("acc-mark absolute border-t-[3px] border-dashed border-accent-text", many ? "-inset-x-0.5" : "-inset-x-2")}
                style={{ bottom: `${(m.forecast / max) * 100}%`, animationDelay: `${650 + i * 140}ms` }}
              />
            </div>
            <span className={cn("font-medium capitalize text-text-secondary", many ? "text-[10.5px] sm:text-[12px]" : "text-[13px]")}>{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const OBS_ICON = { good: CheckCircle2, near: TriangleAlert, far: CircleAlert, info: Info } as const;

export function AccuracyResult({ report }: { report: AccuracyReport }) {
  const obs = observations(report);
  const n = report.length;
  const span =
    n === 3
      ? `${monthName(report.asOf)}, ${monthName(report.asOf, 1)} y ${monthName(report.asOf, 2)}`
      : `los ${n} meses siguientes (de ${monthName(report.asOf)} a ${monthName(report.asOf, n - 1)})`;
  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-6 p-5 sm:p-7">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-[24px] font-bold tracking-[-0.025em] text-text-primary">Así le fue a bria. desde el {longDate(report.asOf)}</h3>
          <p className="text-sm text-text-secondary">
            Calculó como si fuera ese día, sin ver nada después, y lo comparamos con lo que vendiste en {span}.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {report.horizons.map((h, i) => (
            <div key={h.months} className="rise-in flex flex-col items-center gap-2 rounded-2xl bg-surface-soft px-1.5 py-4 text-center sm:px-4 sm:py-5" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="text-[13px] font-semibold text-text-secondary">
                A {h.months} {h.months === 1 ? "mes" : "meses"}
              </span>
              <Ring value={h.accuracy} delay={150 + i * 160} />
              <span className="flex flex-col text-[11.5px] leading-snug text-text-muted sm:block sm:text-[12.5px]">
                <span>
                  esperaba <span className="font-mono text-text-primary">{formatNumber(h.forecast, 0)}</span> u
                </span>
                <span className="hidden sm:inline"> · </span>
                <span>
                  vendiste <span className="font-mono text-text-primary">{formatNumber(h.actual, 0)}</span> u
                </span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h3 className="font-semibold text-text-primary">Mes a mes</h3>
            <p className="text-sm text-text-muted">La barra es lo que vendiste; la línea punteada, lo que bria. había dicho.</p>
          </div>
          <MonthBars months={report.months} />
        </Card>
        <Card className="flex flex-col gap-3 p-5 sm:p-6">
          <h3 className="font-semibold text-text-primary">Lo que te dice esta prueba</h3>
          <ul className="flex flex-col gap-3">
            {obs.map((o, i) => {
              const Icon = OBS_ICON[o.tone];
              return (
                <li key={i} className="rise-in flex gap-3 text-[14px] leading-relaxed text-text-secondary" style={{ animationDelay: `${300 + i * 90}ms` }}>
                  <Icon aria-hidden className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", o.tone === "info" ? "text-text-muted" : TONE_TEXT[o.tone])} />
                  <span>{o.text}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5 sm:px-6">
          <h3 className="font-semibold text-text-primary">Producto por producto</h3>
          <span className="text-xs text-text-muted">en los {report.length} meses</span>
        </div>
        {report.products.length === 0 && (
          <p className="px-5 pb-5 text-sm text-text-muted sm:px-6">Ninguno de estos productos tuvo ventas en esos meses.</p>
        )}
        <ul className="divide-y divide-border">
          {report.products.map((p, i) => {
            const tone = toneOf(p.accuracy);
            return (
              <li key={p.id} className="acc-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:px-6" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium text-text-primary">{p.name}</span>
                  <span className="text-[12px] text-text-muted">
                    esperaba {formatNumber(p.forecast, 0)} u · vendió {formatNumber(p.actual, 0)} u
                  </span>
                </span>
                <span aria-hidden className="col-span-2 row-start-2 block h-1.5 overflow-hidden rounded-full bg-surface-muted sm:col-span-1 sm:row-start-auto">
                  <span className={cn("acc-fill block h-full rounded-full", TONE_BAR[tone])} style={{ width: `${Math.max(3, p.accuracy ?? 0)}%`, animationDelay: `${200 + i * 40}ms` }} />
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[14px] font-semibold text-text-primary">{p.accuracy == null ? "—" : `${Math.round(p.accuracy)} %`}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", TONE_CHIP[tone])}>{toneLabel[tone]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
