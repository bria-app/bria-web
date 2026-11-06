"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandIcon, type BrandIconRef } from "@/components/brand/BrandIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ArtBuy, ArtClean, ArtKinds, ArtModel, ArtRange, ArtSales, ArtTest } from "./art";

type IconRef = BrandIconRef;

interface Step {
  icon: IconRef;
  short: string;
  title: string;
  body: ReactNode;
  note: string;
  Art: ComponentType;
}

/**
 * «Cómo predice bria.»: the forecast told to the shop owner in seven short steps, each with a
 * drawing to play with. Deliberately says what bria. does, not how (no model names, thresholds
 * or parameters): the method is the product.
 */
const STEPS: Step[] = [
  {
    icon: { shop: "boleta" }, short: "Tus ventas", title: "Todo empieza en tu caja", Art: ArtSales,
    body: <>bria. aprende solo de <strong>tu tienda</strong>: lo que vendes y cada «no tengo».</>,
    note: "Los «no tengo» le dicen lo que pudiste vender.",
  },
  {
    icon: { step: "estante" }, short: "Ordena", title: "Sin stock no es sin clientes", Art: ArtClean,
    body: <>Si te quedaste sin mercadería, estima <strong>lo que habrías vendido</strong> y no se deja llevar por una compra rara.</>,
    note: "Así no te pide de menos lo que más se agota.",
  },
  {
    icon: { shop: "caja" }, short: "Tu producto", title: "Cada producto, a su manera", Art: ArtKinds,
    body: <>No se pronostica igual lo que vendes todos los días, lo que sale de vez en cuando o lo que recién trajiste.</>,
    note: "Un solo método para todo falla con los productos pequeños.",
  },
  {
    icon: { step: "curva" }, short: "Aprende", title: "Cómo crece y en qué época", Art: ArtModel,
    body: <>Aprende a la vez si el producto <strong>crece</strong> y en qué <strong>meses</strong> se vende más. Prueba los botones.</>,
    note: "Así no confunde una buena temporada con crecimiento.",
  },
  {
    icon: { step: "reloj" }, short: "Se prueba", title: "Se pone a prueba con tu pasado", Art: ArtTest,
    body: <>Vuelve atrás, adivina meses que ya pasaron y se queda con el método que <strong>menos falló</strong>.</>,
    note: "Por eso puede decirte cuánto acierta.",
  },
  {
    icon: { step: "lejos" }, short: "Lejos", title: "Prudente a lo lejos", Art: ArtRange,
    body: <>Te da un <strong>rango</strong> que se abre con el tiempo. A uno o dos años, no inventa tendencias.</>,
    note: "Lo lejano sirve para planificar, no para comprar hoy.",
  },
  {
    icon: { shop: "bolsa" }, short: "Qué comprar", title: "Cuánto pedir hoy", Art: ArtBuy,
    body: <>Cubre lo que demora tu proveedor <strong>y un mes más</strong>. Mueve la barra.</>,
    note: "Primero te avisa lo que se acabará antes de que llegue el pedido.",
  },
];

const NOTES: { icon: IconRef; title: string; text: string }[] = [
  { icon: { step: "nuevo" }, title: "No adivina lo nuevo", text: "Una competencia o una promoción que aún no pasó." },
  { icon: { step: "aviso" }, title: "Si algo cambia, te avisa", text: "Cuando un producto sube o baja de golpe y se queda así." },
  { icon: { step: "prueba" }, title: "Compruébalo tú", text: "En «Qué tan bien acierta», contra lo que vendiste." },
];

/** Button size `sm` while the tour is narrow (container queries: the tour also lives in a dialog). */
const NARROW_BUTTON = "@max-xl:h-9 @max-xl:gap-1.5 @max-xl:px-3 @max-xl:text-[13px]";

interface PredictionTourProps {
  /** Shown on the last step instead of «Volver al inicio» (e.g. close the dialog). */
  onDone?: () => void;
  doneLabel?: string;
}

export function PredictionTour({ onDone, doneLabel = "Listo" }: PredictionTourProps) {
  const [cur, setCur] = useState(0);
  const step = STEPS[cur];
  const last = cur === STEPS.length - 1;
  const go = (i: number) => setCur(Math.max(0, Math.min(STEPS.length - 1, i)));

  return (
    <div
      className="@container flex flex-col gap-6"
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        if (e.key === "ArrowRight") go(cur + 1);
        if (e.key === "ArrowLeft") go(cur - 1);
      }}
    >
      {/* The path: seven stops on one line. */}
      <nav aria-label="Pasos" className="relative grid grid-cols-7 gap-1">
        <span aria-hidden className="absolute left-[7%] right-[7%] top-[22px] h-0.5 bg-border @max-xl:top-[18px]" />
        <span aria-hidden className="absolute left-[7%] top-[22px] h-0.5 bg-primary transition-[width] duration-700 @max-xl:top-[18px]" style={{ width: `${(86 * cur) / (STEPS.length - 1)}%` }} />
        {STEPS.map((s, k) => (
          <button
            key={s.short}
            type="button"
            onClick={() => go(k)}
            aria-current={k === cur ? "step" : undefined}
            aria-label={`Paso ${k + 1}: ${s.short}`}
            className="group relative flex flex-col items-center gap-2.5"
          >
            <span
              className={cn(
                "relative z-[1] grid h-[46px] w-[46px] place-items-center rounded-full border-2 transition-all duration-500 @max-xl:h-[38px] @max-xl:w-[38px]",
                k === cur
                  ? "border-primary bg-primary text-on-primary shadow-[0_0_0_6px_rgb(var(--c-primary-soft))]"
                  : k < cur
                    ? "border-primary bg-surface text-accent-text"
                    : "border-border bg-surface text-text-muted group-hover:border-accent-line",
              )}
            >
              <BrandIcon icon={s.icon} className="h-[26px] w-[26px] @max-xl:h-[22px] @max-xl:w-[22px]" accentClassName={k === cur ? "stroke-surface" : "stroke-brand"} />
            </span>
            <span className={cn("hidden text-center text-[13px] leading-tight @xl:block", k === cur ? "font-medium text-text-primary" : "text-text-muted")}>{s.short}</span>
          </button>
        ))}
      </nav>

      {/* The step: the drawing on the app's soft grid, and two sentences. */}
      <section aria-live="polite" className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[28px] border border-border bg-surface shadow-soft @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="tour-stage-art relative isolate flex flex-col justify-center border-border bg-surface-soft p-4 @max-3xl:border-b @xl:p-5 @3xl:border-r">
          <div key={cur} className="rise-in mx-auto w-full max-w-[540px]">
            <step.Art />
          </div>
        </div>
        <div className="relative isolate flex flex-col overflow-hidden p-5 @xl:p-8">
          <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 -z-10 h-[150px] w-[150px] rotate-[-8deg] text-accent-line opacity-25">
            <BrandIcon key={cur} icon={step.icon} className="rise-in h-full w-full" />
          </span>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-primary-soft text-accent-text">
              <BrandIcon icon={step.icon} className="h-7 w-7" />
            </span>
            <span className="font-mono text-[13px] text-text-muted">
              Paso {cur + 1} de {STEPS.length}
            </span>
          </div>
          <div key={cur} className="rise-in">
            <h3 className="mb-3 mt-4 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-text-primary">{step.title}</h3>
            <p className="text-[16.5px] leading-relaxed text-text-secondary [&_strong]:font-semibold [&_strong]:text-text-primary">{step.body}</p>
            <p className="mt-4 rounded-2xl border border-accent-line bg-primary-softer px-4 py-3 text-[14.5px] text-text-secondary">{step.note}</p>
          </div>
          {/* Narrow (a phone): smaller buttons and no counter («Paso 1 de 7» is already above), so the row fits. */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <Button variant="secondary" onClick={() => go(cur - 1)} disabled={cur === 0} className={NARROW_BUTTON}>
              <ArrowLeft aria-hidden className="h-4 w-4" /> Anterior
            </Button>
            <span className="whitespace-nowrap font-mono text-[13px] text-text-muted @max-xl:hidden">
              {cur + 1} / {STEPS.length}
            </span>
            {last ? (
              <Button onClick={() => (onDone ? onDone() : go(0))} className={NARROW_BUTTON}>
                {onDone ? doneLabel : "Volver al inicio"}
              </Button>
            ) : (
              <Button onClick={() => go(cur + 1)} className={NARROW_BUTTON}>
                Siguiente <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* What it cannot do, said plainly. */}
      <ul className="grid gap-3 @3xl:grid-cols-3">
        {NOTES.map((n) => (
          <li key={n.title} className="flex items-center gap-3.5 rounded-[22px] border border-border bg-surface px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-text-secondary">
              <BrandIcon icon={n.icon} className="h-[26px] w-[26px]" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-text-primary">{n.title}</span>
              <span className="block text-[14px] leading-snug text-text-secondary">{n.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-text-muted">Los dibujos usan números de ejemplo.</p>
    </div>
  );
}
