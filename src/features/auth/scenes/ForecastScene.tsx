import { ShopIcon } from "@/components/brand/ShopIcons";

/** Illustration only: twelve weeks of sales and six of forecast, with its likely range. */
const PAST = [14, 17, 15, 19, 18, 22, 20, 24, 23, 21, 26, 25];
const FUTURE = [27, 28, 30, 29, 31, 33];
const W = 480;
const H = 190;
const PAD = 16;
const MAX = 40;
const STEP = (W - PAD * 2) / (PAST.length + FUTURE.length - 1);
const x = (i: number) => PAD + i * STEP;
const y = (v: number) => H - PAD - (v / MAX) * (H - PAD * 2);

const line = (vals: number[], from: number) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(from + i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
const LAST = PAST.length - 1;
const PAST_D = line(PAST, 0);
const FUTURE_D = line([PAST[LAST], ...FUTURE], LAST);
const BAND_D =
  `M${x(LAST)} ${y(PAST[LAST])} ` +
  FUTURE.map((v, i) => `L${x(LAST + 1 + i).toFixed(1)} ${y(v + 2 + i * 0.9).toFixed(1)}`).join(" ") +
  " " +
  [...FUTURE].reverse().map((v, i) => `L${x(LAST + FUTURE.length - i).toFixed(1)} ${y(v - 2 - (FUTURE.length - 1 - i) * 0.9).toFixed(1)}`).join(" ") +
  " Z";

/** Scene «pronóstico»: past sales draw in, «Hoy» lands, the forecast and its range extend, advice pops. */
export function ForecastScene() {
  return (
    <div aria-hidden className="relative">
      <div className="rounded-3xl border border-strong-foreground/10 bg-strong-foreground/[0.04] p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-strong-foreground/[0.06]">
            <ShopIcon name="gaseosa" accentClassName="stroke-accent-on-strong" className="h-7 w-7 text-strong-foreground/85" />
          </span>
          <span className="flex flex-col">
            <span className="text-[13px] font-semibold text-strong-foreground/85">Gaseosa 1.5 L</span>
            <span className="text-[12px] text-strong-foreground/50">Ventas por semana</span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} className="stroke-strong-foreground/10" strokeWidth={1} />
          ))}
          <g className="fc-band">
            <path d={BAND_D} className="fill-primary/25" />
          </g>
          <path d={PAST_D} pathLength={1} fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="fc-past stroke-strong-foreground" />
          <g className="fc-today">
            <line x1={x(LAST)} x2={x(LAST)} y1={PAD - 6} y2={H - PAD} strokeDasharray="3 5" className="stroke-strong-foreground/40" strokeWidth={1.5} />
            <text x={x(LAST) + 6} y={PAD + 2} className="fill-strong-foreground/60 font-sans text-[12px]">
              Hoy
            </text>
          </g>
          <g className="fc-future">
            <path d={FUTURE_D} fill="none" strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" className="stroke-primary" />
            <circle cx={x(LAST + FUTURE.length)} cy={y(FUTURE[FUTURE.length - 1])} r={5} className="fill-primary" />
          </g>
        </svg>
      </div>
      <span className="fc-chip-a absolute -top-4 right-6 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-on-primary shadow-soft-lg">
        Te alcanza para 6 días
      </span>
      <span className="fc-chip-b absolute -bottom-4 left-8 rounded-full bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-primary shadow-soft-lg">
        Pide 24 u el lunes
      </span>
    </div>
  );
}
