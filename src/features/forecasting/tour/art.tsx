"use client";

import { useState, type ReactNode } from "react";
import { ShopIcon, type ShopIconName } from "@/components/brand/ShopIcons";
import { cn } from "@/lib/utils";

/**
 * The drawings of the prediction tour, one per step. Toy numbers, chosen to explain the idea;
 * the colours come from the theme tokens so they follow light and dark mode. Styles: `.tour-*`
 * in globals.css (the animations stop under «reduced motion»).
 */

const W = 460;
const H = 300;
const C = {
  primary: "rgb(var(--c-primary))",
  soft: "rgb(var(--c-primary-soft))",
  line: "rgb(var(--c-accent-line))",
  text2: "rgb(var(--c-text-secondary))",
  text3: "rgb(var(--c-text-muted))",
  border: "rgb(var(--c-border))",
  muted: "rgb(var(--c-surface-muted))",
  info: "rgb(var(--c-info))",
};

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="tour-art block h-auto w-full">
      {children}
    </svg>
  );
}

function Axis({ y = 250 }: { y?: number }) {
  return <line x1="30" x2="430" y1={y} y2={y} stroke={C.border} />;
}

export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            value === o.id ? "border-accent-line bg-primary-soft text-accent-text" : "border-border bg-surface text-text-secondary hover:border-accent-line",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- 1. your sales
const DAYS = [9, 11, 8, 12, 14, 10, 7, 10, 12, 9, 0, 0, 13, 11, 12, 10, 15, 13, 9, 11, 12];

export function ArtSales() {
  const n = DAYS.length;
  const bw = 14;
  const gap = (400 - n * bw) / (n - 1);
  const xg = 30 + 10 * (bw + gap);
  return (
    <Frame label="Ventas de un producto, día por día, con dos días sin stock">
      <text className="th" x="30" y="34">Tus ventas, día por día</text>
      <text className="tm" x="30" y="54">una barra por día</text>
      <Axis />
      {DAYS.map((v, i) => {
        const x = 30 + i * (bw + gap);
        const d = { animationDelay: `${i * 70}ms` };
        return v === 0 ? (
          <rect key={i} x={x} y={140} width={bw} height={110} rx={4} fill="none" stroke={C.text3} strokeDasharray="3 3" className="tour-pop" style={d} />
        ) : (
          <rect key={i} x={x} y={250 - v * 9} width={bw} height={v * 9} rx={4} fill={C.primary} className="tour-grow" style={d} />
        );
      })}
      <g className="tour-pop" style={{ animationDelay: "1.7s" }}>
        <rect x={xg - 34} y={70} width={104} height={42} rx={10} className="tour-card" />
        <text className="t" x={xg - 24} y={88}>«No tengo»</text>
        <text className="tm" x={xg - 24} y={104}>sin stock</text>
        <path d={`M${xg + 14} 112 L${xg + 14} 134`} stroke={C.text3} strokeWidth={1.5} />
      </g>
      <text className="tm" x="30" y="274">1</text>
      <text className="tm" x="430" y="274" textAnchor="end">21 días</text>
    </Frame>
  );
}

// ---------------------------------------------------------------- 2. tidy the history
const RAW = [10, 11, 9, 12, 11, 10, 3, 2, 11, 12, 30, 12, 11, 10, 12, 11, 13, 12];

export function ArtClean() {
  const [after, setAfter] = useState<"caja" | "bria">("bria");
  const tidy = after === "bria";
  const n = RAW.length;
  const bw = 16;
  const gap = (400 - n * bw) / (n - 1);
  const k = 6.5;
  const x6 = 30 + 6 * (bw + gap);
  const x10 = 30 + 10 * (bw + gap);
  return (
    <div>
      <Frame label={tidy ? "La historia como la ve bria." : "La historia como quedó en caja"}>
        <text className="th" x="30" y="34">{tidy ? "Así la ve bria." : "Así quedó en la caja"}</text>
        <Axis />
        {RAW.map((v, i) => {
          const x = 30 + i * (bw + gap);
          const gapDay = i === 6 || i === 7;
          if (tidy && gapDay) {
            return (
              <g key={i}>
                <rect x={x} y={250 - v * k} width={bw} height={v * k} rx={4} fill={C.primary} />
                <rect x={x} y={250 - 11 * k} width={bw} height={(11 - v) * k} rx={4} fill={C.soft} stroke={C.primary} strokeDasharray="3 3" className="tour-pop" />
              </g>
            );
          }
          const val = tidy && i === 10 ? 13 : v;
          return <rect key={i} x={x} y={250 - val * k} width={bw} height={val * k} rx={4} fill={!tidy && i === 10 ? C.line : C.primary} className="tour-bar" />;
        })}
        {tidy ? (
          <g className="tour-pop">
            <text className="t" x={x6 - 6} y={250 - 11 * k - 14}>estimado</text>
            <text className="t" x={x10 - 6} y={250 - 13 * k - 14}>compra rara, suavizada</text>
          </g>
        ) : (
          <g className="tour-pop">
            <text className="t" x={x6 - 12} y={250 - 3 * k - 14}>sin stock</text>
            <text className="t" x={x10 - 16} y={250 - 30 * k - 10}>compra rara</text>
          </g>
        )}
      </Frame>
      <Chips value={after} onChange={setAfter} options={[{ id: "caja", label: "Como quedó en caja" }, { id: "bria", label: "Como la ve bria." }]} />
    </div>
  );
}

// ---------------------------------------------------------------- 3. each product its own way
function KindCard({ x, title, sub, path, delay, tag, icon }: { x: number; title: string; sub: string; path: string; delay: number; tag: string; icon: ShopIconName }) {
  return (
    <g className="tour-pop" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x} y={60} width={128} height={150} rx={16} className="tour-card" />
      <foreignObject x={x + 12} y={68} width={32} height={32}>
        <ShopIcon name={icon} className="h-8 w-8 text-text-secondary" />
      </foreignObject>
      <path d={path} fill="none" stroke={C.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${x + 14} 112) scale(1 .62)`} />
      <text className="th" x={x + 14} y={172}>{title}</text>
      <text className="tm" x={x + 14} y={192}>{sub}</text>
      <path d={`M${x + 64} 214 v22`} stroke={C.border} strokeWidth={2} />
      <rect x={x + 8} y={238} width={112} height={34} rx={10} className="tour-tag" />
      <text className="t tour-tag-text" x={x + 64} y={259} textAnchor="middle">{tag}</text>
    </g>
  );
}

export function ArtKinds() {
  return (
    <Frame label="Tres formas de venderse: siempre, a veces y recién llegado">
      <text className="th" x="30" y="34">Tres formas de venderse</text>
      <KindCard x={30} title="Siempre" sub="todas las semanas" path="M0 50 C20 30 30 45 50 30 S80 20 100 15" delay={0} tag="modelo principal" icon="pan" />
      <KindCard x={166} title="A veces" sub="semanas en cero" path="M0 60 h18 v-30 h6 v30 h30 v-22 h6 v22 h40" delay={250} tag="para lo esporádico" icon="pintura" />
      <KindCard x={302} title="Recién llegó" sub="pocas semanas" path="M0 60 L30 52 L45 40 L60 44 L75 30" delay={500} tag="promedio reciente" icon="celular" />
    </Frame>
  );
}

// ---------------------------------------------------------------- 4. growth and season
function curve(f: (i: number) => number) {
  let d = "";
  for (let i = 0; i <= 80; i++) d += `${i ? "L" : "M"}${(30 + i * 5).toFixed(1)} ${f(i).toFixed(1)}`;
  return d;
}
const trend = (i: number) => 200 - i * 1.0;
const wave = (i: number) => 26 * Math.sin((i / 80) * Math.PI * 4 - 0.6);

export function ArtModel() {
  const [view, setView] = useState<"trend" | "season" | "both">("both");
  const label = { trend: "Crecimiento", season: "Temporada", both: "Las dos juntas: así aprende bria." }[view];
  return (
    <div>
      <Frame label={label}>
        <text className="th" x="30" y="34">{label}</text>
        <Axis />
        <g key={view}>
          {view !== "season" && <path d={curve(trend)} pathLength={1} className="tour-draw" fill="none" stroke={C.text3} strokeWidth={2} strokeLinecap="round" />}
          {view === "season" && <path d={curve((i) => 150 + wave(i))} pathLength={1} className="tour-draw" fill="none" stroke={C.info} strokeWidth={2} strokeLinecap="round" />}
          {view === "both" && <path d={curve((i) => trend(i) + wave(i))} pathLength={1} className="tour-draw" fill="none" stroke={C.primary} strokeWidth={3.2} strokeLinecap="round" />}
        </g>
        <text className="tm" x="30" y="274">hace 2 años</text>
        <text className="tm" x="430" y="274" textAnchor="end">hoy</text>
      </Frame>
      <Chips value={view} onChange={setView} options={[{ id: "trend", label: "Crecimiento" }, { id: "season", label: "Temporada" }, { id: "both", label: "Las dos juntas" }]} />
    </div>
  );
}

// ---------------------------------------------------------------- 5. the test with your past
const REAL = [60, 64, 70, 66, 72, 78];
const GUESSES = [
  { name: "Método A", vals: [58, 62, 66, 68, 70, 74], color: C.primary },
  { name: "Método B", vals: [62, 70, 80, 88, 96, 104], color: C.info },
  { name: "Método C", vals: [55, 55, 55, 55, 55, 55], color: C.text3 },
];

export function ArtTest() {
  const [run, setRun] = useState(0);
  const X = (i: number) => 210 + i * 40;
  const Y = (v: number) => 250 - (v - 40) * 2.4;
  const err = (vals: number[]) => vals.reduce((t, v, i) => t + Math.abs(v - REAL[i]), 0);
  return (
    <div>
      <Frame label="Tres métodos adivinan meses que ya pasaron; gana el que menos falla">
        <text className="th" x="30" y="34">Gana el que menos falla</text>
        <text className="tm" x="30" y="54">en meses que no vio</text>
        <Axis />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={30 + i * 18} y={Y(48 + i * 1.6)} width={12} height={250 - Y(48 + i * 1.6)} rx={3} fill={C.line} />
        ))}
        <line x1="196" x2="196" y1="70" y2="252" stroke={C.text3} strokeDasharray="4 4" />
        <text className="tm" x="160" y="268">corte</text>
        <rect x="200" y="70" width="230" height="182" rx="6" fill={C.muted} opacity={0.45} />
        {REAL.map((v, i) => (
          <rect key={i} x={X(i) - 7} y={Y(v)} width={14} height={250 - Y(v)} rx={3} fill={C.primary} opacity={0.9} />
        ))}
        <g key={run}>
          {GUESSES.map((g, k) => (
            <path
              key={g.name}
              d={g.vals.map((v, i) => `${i ? "L" : "M"}${X(i)} ${Y(v)}`).join("")}
              pathLength={1}
              className="tour-draw"
              style={{ animationDelay: `${0.8 + k * 0.3}s` }}
              fill="none"
              stroke={g.color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {GUESSES.map((g, k) => {
            const win = k === 0;
            return (
              <g key={g.name} className="tour-pop" style={{ animationDelay: `${2.6 + k * 0.25}s` }}>
                <rect x={30} y={74 + k * 30} width={150} height={24} rx={8} fill={win ? C.soft : "rgb(var(--c-surface))"} stroke={win ? C.line : C.border} />
                <circle cx={44} cy={86 + k * 30} r={4} fill={g.color} />
                <text className="t" x={54} y={90 + k * 30}>{g.name}</text>
                <text className="tm" x={170} y={90 + k * 30} textAnchor="end">{`${err(g.vals)} u${win ? " ✓" : ""}`}</text>
              </g>
            );
          })}
        </g>
        <text className="tm" x="430" y="268" textAnchor="end">lo que de verdad vendiste</text>
      </Frame>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setRun((r) => r + 1)} className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-accent-line">
          Repetir
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 6. range and the far future
const HIST = [60, 66, 62, 70, 68, 74, 72, 78, 76, 80];

export function ArtRange() {
  const [far, setFar] = useState<"near" | "far">("near");
  const isFar = far === "far";
  const X = (i: number) => 30 + i * 16.5;
  const Y = (v: number) => 250 - v * 1.6;
  const n0 = HIST.length - 1;
  const steps = 14;
  const checked = 6;
  const up: string[] = [];
  const lo: string[] = [];
  const mid: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const x = X(n0 + s);
    const m = 80 + (isFar ? Math.min(s, checked) : s) * 2 + 6 * Math.sin(s / 2);
    const w = 6 + s * 2.6;
    mid.push(`${s ? "L" : "M"}${x} ${Y(m)}`);
    up.push(`${s ? "L" : "M"}${x} ${Y(m + w)}`);
    lo.unshift(`L${x} ${Y(Math.max(0, m - w))}`);
  }
  const xc = X(n0 + checked);
  return (
    <div>
      <Frame label={isFar ? "A uno o dos años sigue tu ritmo con la temporada" : "Un número y un rango probable"}>
        <text className="th" x="30" y="34">{isFar ? "Lejos: sin inventar tendencias" : "Un rango probable"}</text>
        <Axis />
        <path d={up.join("") + lo.join("") + "Z"} fill={C.soft} className="tour-pop" />
        <path d={HIST.map((v, i) => `${i ? "L" : "M"}${X(i)} ${Y(v)}`).join("")} fill="none" stroke={C.text2} strokeWidth={2.4} strokeLinecap="round" />
        <path key={far} d={mid.join("")} pathLength={1} className="tour-draw" fill="none" stroke={C.primary} strokeWidth={3} strokeLinecap="round" />
        {isFar ? (
          <g className="tour-pop">
            <line x1={xc} x2={xc} y1="60" y2="252" stroke={C.text3} strokeDasharray="4 4" />
            <text className="tm" x={xc - 8} y="70" textAnchor="end">comprobado</text>
            <text className="tm" x={xc + 8} y="70">luego: tu ritmo</text>
            <text className="tm" x={xc + 8} y="86">+ temporada</text>
          </g>
        ) : (
          <text className="tm" x={X(n0 + 8)} y={Y(118)}>rango probable</text>
        )}
        <text className="tm" x="30" y="274">tu historia</text>
        <text className="tm" x={X(n0) + 4} y="274">hoy</text>
      </Frame>
      <Chips value={far} onChange={setFar} options={[{ id: "near", label: "Próximos meses" }, { id: "far", label: "Uno o dos años" }]} />
    </div>
  );
}

// ---------------------------------------------------------------- 7. what to buy
export function ArtBuy() {
  const [lead, setLead] = useState(7);
  const perDay = 4;
  const stock = 70;
  const need = perDay * (lead + 30);
  const buy = Math.max(0, need - stock);
  const sc = 300 / 260;
  const bx = 140;
  return (
    <div>
      <Frame label={`Necesitas ${need} unidades, tienes ${stock}: pide ${buy}`}>
        <text className="th" x="30" y="40">{`Vendes ~${perDay} al día · tienes ${stock}`}</text>
        <text className="t" x="30" y="104">Lo que necesitas</text>
        <rect x={bx} y={88} width={need * sc} height={24} rx={8} fill={C.soft} stroke={C.line} className="tour-width" />
        <text className="tm" x={bx + 8 + need * sc} y={105}>{`${need} u`}</text>
        <text className="tm" x={bx} y={130}>espera + 30 días</text>
        <text className="t" x="30" y="174">Lo que tienes</text>
        <rect x={bx} y={158} width={stock * sc} height={24} rx={8} fill={C.muted} stroke={C.border} />
        <text className="tm" x={bx + 8 + stock * sc} y={175}>{`${stock} u`}</text>
        <text className="t" x="30" y="234">Pide</text>
        <rect x={bx} y={218} width={Math.max(2, buy * sc)} height={24} rx={8} fill={C.primary} className="tour-width" />
        <text className="th" x={bx + 10 + buy * sc} y={236}>{`${buy} u`}</text>
      </Frame>
      <label className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-text-secondary">
        <span className="whitespace-nowrap">Tu proveedor demora</span>
        <span className="flex items-center gap-3">
          <input type="range" min={1} max={21} value={lead} onChange={(e) => setLead(Number(e.target.value))} className="w-32 accent-[rgb(var(--c-primary))]" />
          <span className="w-14 whitespace-nowrap font-mono text-text-muted">{lead} días</span>
        </span>
      </label>
    </div>
  );
}
