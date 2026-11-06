"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { BrandIcon, type BrandIconRef } from "@/components/brand/BrandIcon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

/* ── Small illustrations, drawn in the app's tokens (no data: they show the idea). ─────────── */

const W = 280;
const H = 120;
const wave = (f: (x: number) => number, n = 48) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = (i / n) * W;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${f(i / n).toFixed(1)}`;
  }).join(" ");
/** The part of a curve between `from` and `to` (0..1 of the width). */
const seg = (f: (x: number) => number, from: number, to: number, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = from + ((to - from) * i) / n;
    return `${i ? "L" : "M"}${(t * W).toFixed(1)} ${f(t).toFixed(1)}`;
  }).join(" ");
const sales = (t: number) => 70 - 18 * Math.sin(t * Math.PI * 4) - 20 * t + Math.sin(t * 57) * 7;
const season = (t: number) => 60 - 22 * Math.sin(t * Math.PI * 4) - 12 * t;

function Illus({ kind }: { kind: string }) {
  const common = "fill-none stroke-[2.5]";
  if (kind === "ventas")
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => {
          const h = 30 + 40 * Math.abs(Math.sin(i * 0.9)) + (i % 5) * 4;
          const out = i === 8 || i === 9;
          return <rect key={i} x={8 + i * 19.5} y={H - 10 - h} width={13} height={h} rx={4} className={out ? "fill-danger/30" : "fill-text-primary/15"} />;
        })}
        <text x={8 + 8 * 19.5} y={18} className="fill-danger text-[10px] font-semibold">sin stock</text>
      </svg>
    );
  if (kind === "limpieza")
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        <path d={wave((t) => (t > 0.55 && t < 0.68 ? 105 : sales(t)))} className={cn(common, "stroke-text-muted/45")} strokeDasharray="4 5" />
        <path d={wave(sales)} className={cn(common, "stroke-accent-text")} />
        <text x={150} y={114} className="fill-text-muted text-[10px]">el hueco del quiebre se rellena</text>
      </svg>
    );
  if (kind === "tipo")
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        {[
          ["regular", 22, "FTGM y rivales"],
          ["esporádico", 60, "Croston"],
          ["nuevo", 98, "promedio reciente"],
        ].map(([l, y, m]) => (
          <g key={l as string}>
            <rect x={6} y={(y as number) - 14} width={92} height={24} rx={12} className="fill-surface-muted" />
            <text x={52} y={(y as number) + 2} textAnchor="middle" className="fill-text-primary text-[11px] font-semibold">{l}</text>
            <path d={`M104 ${(y as number) - 2} H 150`} className="stroke-text-muted/60" strokeWidth={2} markerEnd="url(#hw-arrow)" />
            <text x={158} y={(y as number) + 2} className={cn("text-[11px] font-semibold", l === "regular" ? "fill-accent-text" : "fill-text-secondary")}>{m}</text>
          </g>
        ))}
        <defs>
          <marker id="hw-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" className="fill-text-muted/60" />
          </marker>
        </defs>
      </svg>
    );
  if (kind === "ftgm")
    return (
      <svg viewBox={`0 0 ${W} 150`} className="w-full" aria-hidden>
        {/* 1. accumulate: a smooth rising curve. 2. coefficients that oscillate. 3. back to sales, with season. */}
        <text x={0} y={11} className="fill-text-muted text-[10px]">① suma acumulada</text>
        <path d={wave((t) => 48 - 34 * t - 4 * Math.sin(t * Math.PI * 4) * t, 40)} className={cn(common, "stroke-text-primary/60")} transform="translate(0 6) scale(0.42 1)" />
        <text x={128} y={11} className="fill-text-muted text-[10px]">② a(t), b(t) con Fourier</text>
        <g transform="translate(128 6) scale(0.54 1)">
          <path d={wave((t) => 30 - 12 * Math.sin(t * Math.PI * 4), 40)} className={cn(common, "stroke-primary")} />
          <path d={wave((t) => 34 - 7 * Math.cos(t * Math.PI * 4 + 0.6), 40)} className={cn(common, "stroke-text-muted/70")} />
        </g>
        <text x={0} y={84} className="fill-text-muted text-[10px]">③ de vuelta a ventas por mes, con su temporada → pronóstico</text>
        <g transform="translate(0 86) scale(1 0.55)">
          <path d={seg(season, 0, 0.7)} className={cn(common, "stroke-text-primary/45")} />
          <path d={seg(season, 0.7, 1)} className={cn(common, "stroke-accent-text")} strokeDasharray="6 5" />
        </g>
      </svg>
    );
  if (kind === "torneo")
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
        {[
          ["FTGM", 0.92],
          ["FTGM + año pasado", 1],
          ["Tendencia suavizada", 0.74],
          ["Igual que hace un año", 0.66],
          ["Temporada prudente", 0.58],
        ].map(([n, v], i) => (
          <g key={n as string}>
            <text x={0} y={14 + i * 22} className={cn("text-[10.5px]", i === 1 ? "fill-text-primary font-semibold" : "fill-text-secondary")}>{n}</text>
            <rect x={140} y={5 + i * 22} width={130} height={10} rx={5} className="fill-surface-muted" />
            <rect x={140} y={5 + i * 22} width={130 * (v as number)} height={10} rx={5} className={i === 1 ? "fill-primary" : "fill-text-muted/40"} />
          </g>
        ))}
      </svg>
    );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <rect x={10} y={20} width={70} height={80} rx={10} className="fill-surface-muted" />
      <rect x={10} y={60} width={70} height={40} rx={10} className="fill-text-primary/20" />
      <text x={45} y={14} textAnchor="middle" className="fill-text-muted text-[10px]">tienes</text>
      <path d="M92 60 H 130" className="stroke-text-muted/60" strokeWidth={2} markerEnd="url(#hw-arrow2)" />
      <rect x={140} y={20} width={130} height={80} rx={12} className="fill-primary-soft" />
      <text x={205} y={52} textAnchor="middle" className="fill-text-primary text-[12px] font-semibold">Compra 42 u</text>
      <text x={205} y={72} textAnchor="middle" className="fill-text-secondary text-[10px]">cubre espera + 1 mes</text>
      <defs>
        <marker id="hw-arrow2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" className="fill-text-muted/60" />
        </marker>
      </defs>
    </svg>
  );
}

/* ── The six stations a forecast goes through. Facts as in the engine and the API. ─────────── */

interface Station {
  id: string;
  icon: BrandIconRef;
  short: string;
  title: string;
  body: string;
  tech: string;
  star?: boolean;
}

const STATIONS: Station[] = [
  {
    id: "ventas",
    icon: { shop: "boleta" },
    short: "Tus ventas",
    title: "Lo que pasa por tu caja",
    body: "Cada venta de la caja, cada compra que ingresa y cada «no tengo» que registras (venta perdida) quedan guardados día por día. Eso es lo único que bria. usa: tus propios datos.",
    tech: "La API arma por producto la serie diaria de ventas y marca los días de quiebre: los días con venta perdida (y los 3 siguientes) y los primeros 7 días de cada racha con el estante vacío. Así no se inventa demanda en un producto que simplemente no se vende fuera de temporada.",
  },
  {
    id: "limpieza",
    icon: { step: "estante" },
    short: "Limpieza",
    title: "Un cero por falta de stock no es un cero de ventas",
    body: "Si te quedaste sin mercadería, esos días vendiste poco porque no tenías, no porque nadie quiso. bria. reconstruye lo que habrías vendido y suaviza los picos raros (una compra grande de una sola vez). Si tus ventas cambiaron de nivel para quedarse (abrió una competencia al lado, ganaste un cliente grande), te avisa.",
    tech: "Se agrupa por mes (≥ 24 meses de historia) o por semana (≥ 26 semanas); el periodo en curso se excluye. Un periodo con ≥ 10 % de días en quiebre se repara: si la proporción es menor a 0,6 y hubo venta, se escala por 1/(1 − s) con tope de 2 veces lo interpolado; si no, se interpola. Los atípicos se suavizan con un filtro de Hampel sobre la serie sin temporada. Cambio de nivel: en el último año y medio se busca un salto de al menos 20 % (t de Welch ≥ 4) que se explique mejor como escalón que como tendencia, que dure al menos 3 meses (8 semanas) y que no haya ocurrido en las mismas fechas del año anterior (eso sería temporada). Se avisa, pero no se fuerza: reescalar la historia previa no mejoró el acierto en las pruebas con datos reales (M5).",
  },
  {
    id: "tipo",
    icon: { shop: "caja" },
    short: "Tipo de producto",
    title: "No todos los productos se pronostican igual",
    body: "Un producto que se vende todas las semanas pasa al FTGM y a la competencia. Uno que se vende de vez en cuando (más de la mitad de los periodos en cero) va a un método hecho para ventas sueltas. Uno nuevo, con menos de medio año, usa el promedio reciente.",
    tech: "Intermitente (> 50 % de periodos en cero): Croston-SBA (α = 0,1). Menos de 26 semanas completas: promedio móvil semanal. El resto entra a la competencia, donde el FTGM es el modelo principal.",
  },
  {
    id: "ftgm",
    icon: { step: "curva" },
    short: "FTGM",
    title: "El FTGM: el modelo que lee crecimiento y temporada a la vez",
    body: "Es el corazón del sistema. Primero suma las ventas una tras otra (así el ruido de cada mes pesa menos y queda una curva suave). Luego ajusta una ecuación de crecimiento cuyos coeficientes suben y bajan como olas a lo largo del año: así aprende la tendencia y la temporada juntas. Al final vuelve de la curva acumulada a ventas por mes, y eso es el pronóstico.",
    tech: "FTGM(1,1,N) de Ye et al. (2024), forma integral: y = suma acumulada de x; dy/dt = a(t)·y + b(t), con a(t) y b(t) expandidos en series de Fourier de orden N y periodo T (12 mensual, 52 semanal). Se estima por mínimos cuadrados o ridge (λ ∈ {0; 0,5; 3; 10}); se resuelve con RK45 y se restaura x̂ = a(t)·ŷ + b(t). El Algoritmo 1 elige N y λ por el error de validación, con N acotado por Nyquist y el largo de la historia. Si la solución diverge (> 50 × el máximo histórico) se descarta.",
    star: true,
  },
  {
    id: "torneo",
    icon: { step: "reloj" },
    short: "Competencia",
    title: "El FTGM compite con cuatro rivales, en tu propio pasado",
    body: "bria. retrocede a varios momentos de tu historia, pide a cada método que adivine los meses que siguieron y mide cuánto se equivocó cada uno. Gana el que menos unidades erró con tu producto. Si el FTGM empata casi con el mejor, se prefiere el FTGM; si pierde, se usa el ganador y te lo dice. Como solo se puede comprobar hasta 6 meses adelante, más allá de eso el pronóstico ya no sigue subiendo ni bajando: mantiene tu ritmo reciente y solo repite la temporada.",
    tech: "Candidatos: FTGM, FTGM combinado (promedio con «igual que el año pasado»), suavizado de nivel amortiguado, «igual que el año pasado» y suavizado estacional. Validación rolling-origin con 6 orígenes (mensual) u 8 (semanal) y h = mín(horizonte; 6 meses u 8 semanas); gana el menor MAE y la familia FTGM se prefiere si queda a menos del 3 %. El intervalo del 90 % usa el error fuera de muestra; el «acierta X %» es 100 − WAPE del ganador en esa validación (puede ser optimista). Después de esos h periodos ningún modelo extrapola: el nivel se fija en el ritmo reciente sin temporada (3 meses u 8 semanas) y se multiplica por los factores estacionales cuando la temporada se repite de un año a otro; con menos de dos temporadas de historia se promedia mitad y mitad con la forma del modelo. En datos reales (M5) esto subió el acierto a 12 meses de 60.7 a 65.4 %.",
  },
  {
    id: "decision",
    icon: { shop: "bolsa" },
    short: "Qué comprar",
    title: "Del pronóstico a la compra",
    body: "Con lo que venderás día a día, lo que tienes, lo que demora tu proveedor y tu stock mínimo, bria. te dice cuánto te alcanza, qué comprar ya y cuánto. La compra cubre la espera del proveedor y un mes más.",
    tech: "Política order-up-to: se sugiere comprar si el stock ≤ punto de reorden o si no cubre la demanda de (tiempo de entrega + 14 días) + stock de seguridad; la cantidad lleva el inventario a la demanda de (tiempo de entrega + 30 días) + stock de seguridad. La cobertura en días usa la misma demanda diaria del pronóstico.",
  },
];

/**
 * "¿Cómo funciona?": a tour of the six stations a forecast goes through, with the FTGM at its heart.
 * `onShortTour` (Premium): a quiet link to the short, non-technical tour «Cómo predice bria.».
 */
export function HowItWorksButton({ onShortTour }: { onShortTour?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(3);
  const [tech, setTech] = useState(false);
  const s = STATIONS[i];

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <HelpCircle aria-hidden className="h-4 w-4" /> ¿Cómo funciona?
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="¿Cómo calcula bria. cuánto venderás?"
        description="Seis pasos, de tu caja a tu próxima compra. Toca cada uno."
        size="xl"
      >
        <div className="flex flex-col gap-5">
          {/* The line of stations. */}
          <ol className="relative grid grid-cols-3 gap-2 sm:grid-cols-6">
            <span aria-hidden className="absolute left-[8%] right-[8%] top-6 hidden h-0.5 bg-border sm:block" />
            {STATIONS.map((st, k) => (
              <li key={st.id} className="relative">
                <button
                  type="button"
                  onClick={() => setI(k)}
                  aria-current={k === i ? "step" : undefined}
                  className="group flex w-full flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center"
                >
                  <span
                    className={cn(
                      "relative grid h-12 w-12 place-items-center rounded-2xl border transition-all duration-300",
                      k === i
                        ? "scale-110 border-primary bg-primary text-on-primary shadow-soft-lg"
                        : st.star
                          ? "border-primary/60 bg-primary-soft text-accent-text group-hover:border-primary"
                          : "border-border bg-surface text-text-secondary group-hover:border-text-muted/50",
                    )}
                  >
                    <BrandIcon icon={st.icon} className="h-6 w-6" accentClassName={k === i ? "stroke-surface" : "stroke-brand"} />
                    {st.star && k !== i && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-primary" />}
                  </span>
                  <span className={cn("text-[12.5px] leading-tight", k === i ? "font-semibold text-text-primary" : "text-text-secondary")}>{st.short}</span>
                </button>
              </li>
            ))}
          </ol>

          {/* The station, explained. */}
          <div key={s.id} className="rise-in grid gap-5 rounded-3xl border border-border bg-surface-soft/60 p-5 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] sm:p-6">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[12px] text-text-muted">
                Paso {i + 1} de {STATIONS.length}
                {s.star && <span className="ml-2 font-sans font-semibold text-accent-text">· aquí entra el FTGM</span>}
              </span>
              <h3 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-text-primary">{s.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-text-secondary">{s.body}</p>
              <button
                type="button"
                aria-expanded={tech}
                onClick={() => setTech((v) => !v)}
                className="w-fit text-[13px] font-semibold text-accent-text hover:underline"
              >
                {tech ? "Ocultar el detalle técnico" : "Ver el detalle técnico"}
              </button>
              {tech && <p className="rounded-2xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-text-secondary">{s.tech}</p>}
            </div>
            <div className="flex items-center rounded-2xl bg-surface p-4">
              <Illus kind={s.id} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
              <ArrowLeft aria-hidden className="h-4 w-4" /> Anterior
            </Button>
            {onShortTour ? (
              // On a phone it takes its own line below the buttons instead of squeezing between them.
              <p className="order-last w-full text-center text-xs text-text-muted sm:order-none sm:w-auto">
                ¿Prefieres la versión corta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onShortTour();
                  }}
                  className="font-semibold text-accent-text hover:underline"
                >
                  Ver el recorrido
                </button>
              </p>
            ) : (
              <p className="hidden text-center text-xs text-text-muted sm:block">
                Para comprobarlo con tus ventas, usa «Qué tan bien acierta» en los resultados.
              </p>
            )}
            <Button variant="secondary" size="sm" onClick={() => setI((k) => Math.min(STATIONS.length - 1, k + 1))} disabled={i === STATIONS.length - 1}>
              Siguiente <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
