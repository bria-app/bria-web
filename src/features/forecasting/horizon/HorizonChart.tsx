"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ATTEMPT_NAMES,
  attemptsAt,
  curveAt,
  niceScale,
  originsOf,
  pendingLabels,
  tangents,
  type Attempt,
  type HorizonPoint,
  type HorizonSeries,
  type RehearsalPass,
} from "./series";

const SAMPLES_PAST = 96;
const SAMPLES_FUTURE = 36;
const MORPH_MS = 480;
export const READ_MS = 900;
const STEP_MS = 420;
/** The rehearsal plays at least this long: one whole pass, even if the engine answers first. */
const MIN_REHEARSAL_MS = READ_MS + STEP_MS * 6;
const STEP_HURRY_MS = 110;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f = (n: number) => n.toFixed(1);

interface Geo {
  left: number;
  right: number;
  base: number;
  xHoy: number;
  past: number[];
  fut: number[];
  lo: number[];
  hi: number[];
}

interface Layout {
  geo: Geo;
  top: number;
  yOf: (v: number) => number;
  xOf: (i: number) => number;
  ticks: { v: number; y: number }[];
  xLabels: { x: number; label: string; future: boolean }[];
  /** Exact curves, for when nothing is moving. */
  d: { past: string; area: string; fut: string; band: string };
  points: { x: number; y: number; point: HorizonPoint; future: boolean }[];
  hasFuture: boolean;
  end: { x: number; y: number; value: number } | null;
}

function samples(vals: number[], n: number): number[] {
  const m = tangents(vals);
  return Array.from({ length: n }, (_, i) => curveAt(vals, m, (i / (n - 1)) * (vals.length - 1)));
}

/** A dense polyline through the points: at rest it is the true curve. */
function dense(vals: number[], x0: number, x1: number): string {
  const n = vals.length;
  if (n === 1) return `M${f(x0)} ${f(vals[0])}L${f(x1)} ${f(vals[0])}`;
  const m = tangents(vals);
  const steps = (n - 1) * 8;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (n - 1);
    d += `${i ? "L" : "M"}${f(x0 + (t / (n - 1)) * (x1 - x0))} ${f(curveAt(vals, m, t))}`;
  }
  return d;
}

function buildLayout(past: HorizonPoint[], future: HorizonPoint[], pending: number, w: number, h: number): Layout | null {
  if (past.length === 0 || w < 40 || h < 40) return null;
  const narrow = w < 520;
  const left = narrow ? 40 : 52;
  const right = w - (narrow ? 8 : 14);
  const topY = 24;
  const base = h - 26;
  const P = past.length;
  const F = future.length || pending;
  // The future gets a share of the width of its own: a single month beside 24 would be a sliver.
  const share = Math.min(0.5, Math.max(narrow ? 0.3 : 0.24, F / (P + F)));
  const xHoy = right - share * (right - left);

  const lastPast = past[P - 1].value;
  const max = Math.max(...past.map((p) => p.value), ...future.map((p) => p.hi ?? p.value), 1);
  const { top, ticks } = niceScale(max);
  const yOf = (v: number) => base - (Math.max(0, v) / top) * (base - topY);
  const xOf = (i: number) =>
    i < P ? (P === 1 ? xHoy : left + (i / (P - 1)) * (xHoy - left)) : xHoy + ((i - P + 1) / Math.max(1, F)) * (right - xHoy);

  const pastY = past.map((p) => yOf(p.value));
  const futY = [yOf(lastPast), ...future.map((p) => yOf(p.value))];
  const loY = [yOf(lastPast), ...future.map((p) => yOf(p.lo ?? p.value))];
  const hiY = [yOf(lastPast), ...future.map((p) => yOf(p.hi ?? p.value))];

  const pastD = dense(pastY, left, xHoy);
  const futD = future.length ? dense(futY, xHoy, right) : "";
  const loD = future.length ? dense(loY, xHoy, right) : "";
  const hiRev = future.length ? dense([...hiY].reverse(), right, xHoy).replace(/^M/, "L") : "";

  const points = [
    ...past.map((point, i) => ({ x: xOf(i), y: pastY[i], point, future: false })),
    ...future.map((point, j) => ({ x: xOf(P + j), y: futY[j + 1], point, future: true })),
  ];

  // Axis labels: every future period that fits, then the past from today backwards.
  const futureLabels = future.length ? future.map((p) => p.label) : pendingLabels(past[P - 1].date, pending);
  const gap = narrow ? 44 : 58;
  const xLabels: Layout["xLabels"] = [];
  let edge = Infinity;
  for (let j = F - 1; j >= 0; j--) {
    const x = xOf(P + j);
    if (edge - x < gap || !futureLabels[j]) continue;
    xLabels.push({ x, label: futureLabels[j], future: true });
    // The last label ends at the edge instead of centring there: its text reaches further left.
    edge = j === F - 1 ? x - gap / 2 : x;
  }
  for (let i = P - 1; i >= 0; i--) {
    const x = xOf(i);
    if (edge - x < gap) continue;
    xLabels.push({ x, label: past[i].label, future: false });
    edge = x;
  }

  const last = future[future.length - 1];
  return {
    geo: {
      left,
      right,
      base,
      xHoy,
      past: samples(pastY, SAMPLES_PAST),
      fut: samples(futY, SAMPLES_FUTURE),
      lo: samples(loY, SAMPLES_FUTURE),
      hi: samples(hiY, SAMPLES_FUTURE),
    },
    top,
    yOf,
    xOf,
    ticks: ticks.map((v) => ({ v, y: yOf(v) })),
    xLabels,
    d: {
      past: pastD,
      area: `${pastD}L${f(xHoy)} ${f(base)}L${f(left)} ${f(base)}Z`,
      fut: futD,
      band: future.length ? `${loD}${hiRev}Z` : "",
    },
    points,
    hasFuture: future.length > 0,
    end: last ? { x: right, y: futY[futY.length - 1], value: last.value } : null,
  };
}

function polyline(ys: number[], x0: number, x1: number): string {
  const n = ys.length;
  let d = "";
  for (let i = 0; i < n; i++) d += `${i ? "L" : "M"}${f(x0 + (i / (n - 1)) * (x1 - x0))} ${f(ys[i])}`;
  return d;
}

function bandPath(lo: number[], hi: number[], x0: number, x1: number): string {
  const n = lo.length;
  let d = polyline(lo, x0, x1);
  for (let i = n - 1; i >= 0; i--) d += `L${f(x0 + (i / (n - 1)) * (x1 - x0))} ${f(hi[i])}`;
  return `${d}Z`;
}

interface Track {
  from: number;
  to: number;
  start: number;
  dur: number;
  ease: (t: number) => number;
}

export interface ChartScrub {
  point: HorizonPoint;
  future: boolean;
}

/**
 * The past as it was, today, and what comes after, all on one line. Everything that moves is
 * written straight to the SVG from one animation frame loop, and only while something moves:
 * React draws the frame and takes part only when the data or the month under the cursor changes.
 *
 * - On arrival the line draws itself up to today and the forecast opens from there.
 * - With no forecast yet, the zone it will fill stands empty, as wide as the horizon asked for.
 * - While calculating, `rehearsal` plays: a cursor walks the last months and three simple methods
 *   try to guess what is hidden after it.
 * - When `settle` arrives the current pass hurries to the end and `onSettled` fires; the parent
 *   then hands the real result and the line turns into it.
 */
export function HorizonChart({
  series,
  pendingPeriods,
  rehearsal,
  settle,
  onSettled,
  onPassChange,
  onScrub,
  interactive,
  still,
  className,
}: {
  series: HorizonSeries | null;
  pendingPeriods: number;
  rehearsal: RehearsalPass[] | null;
  settle: boolean;
  onSettled: () => void;
  onPassChange?: (pass: RehearsalPass | null) => void;
  onScrub: (scrub: ChartScrub | null) => void;
  interactive: boolean;
  still: boolean;
  className?: string;
}) {
  // Twice on a page (the stage and a product's detail): ids that refer to each other can't repeat.
  const uid = `hz${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [passIndex, setPassIndex] = useState(0);
  const rehearsing = !!rehearsal?.length && !still;
  const pass = rehearsing ? rehearsal[passIndex % rehearsal.length] : null;
  if (!rehearsing && passIndex !== 0) setPassIndex(0);

  // The last thing shown stays while a new request is on its way.
  const [kept, setKept] = useState<HorizonSeries | null>(null);
  if (series && series !== kept) setKept(series);
  const rest = series ?? kept;

  const layout = useMemo(() => {
    if (pass) return buildLayout(pass.points, [], pendingPeriods, size.w, size.h);
    return rest ? buildLayout(rest.past, rest.future, rest.future.length ? 0 : pendingPeriods, size.w, size.h) : null;
  }, [pass, rest, pendingPeriods, size.w, size.h]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The drawing's moving parts, found once by name. From here on they are written to directly.
  const svg = useRef<SVGSVGElement>(null);
  const n = useRef<Record<string, SVGElement | null>>({});
  useEffect(() => {
    svg.current?.querySelectorAll<SVGElement>("[data-n]").forEach((el) => {
      n.current[el.dataset.n ?? ""] = el;
    });
  }, []);

  const engine = useRef({
    raf: 0,
    geo: null as Geo | null,
    morphFrom: null as Geo | null,
    morphTo: null as Geo | null,
    morphStart: 0,
    exact: null as Layout | null,
    wroteExact: false,
    tracks: {} as Record<string, Track>,
    v: { pastR: 0, futR: 0, pend: 0, hoy: 0, over: 0, ghost: 0, err: 0 } as Record<string, number>,
    // Rehearsal
    origins: [] as number[],
    values: [] as number[],
    labels: [] as string[],
    step: -1,
    stepStart: 0,
    readUntil: 0,
    pauseUntil: 0,
    startedAt: 0,
    attempts: [] as Attempt[],
    best: -1,
    layout: null as Layout | null,
    waitingLayout: false,
    settle: false,
    settled: false,
    onSettled,
    running: false,
  });

  useEffect(() => {
    engine.current.onSettled = onSettled;
    engine.current.settle = settle;
  });

  const passCount = rehearsal?.length ?? 0;
  const advancePass = useRef(() => undefined as void);
  useEffect(() => {
    advancePass.current = () => setPassIndex((i) => (passCount ? (i + 1) % passCount : 0));
  });

  const legend = useRef<HTMLUListElement>(null);

  // The one loop. Stops itself as soon as nothing is moving.
  const loop = useRef<(now: number) => void>(() => undefined);
  useEffect(() => {
    const E = engine.current;
    const set = (el: SVGElement | null | undefined, attr: string, value: string) => el?.setAttribute(attr, value);

    const drawGeo = (g: Geo) => {
      const nodes = n.current;
      const past = polyline(g.past, g.left, g.xHoy);
      set(nodes.pLine, "d", past);
      set(nodes.pArea, "d", `${past}L${f(g.xHoy)} ${f(g.base)}L${f(g.left)} ${f(g.base)}Z`);
      set(nodes.fLine, "d", polyline(g.fut, g.xHoy, g.right));
      set(nodes.fBand, "d", bandPath(g.lo, g.hi, g.xHoy, g.right));
    };

    const placeHoy = (g: Geo) => {
      const nodes = n.current;
      set(nodes.hoy, "transform", `translate(${f(g.xHoy)} 0)`);
      set(nodes.hoyDot, "cy", f(g.past[g.past.length - 1]));
      set(nodes.hoyPing, "cy", f(g.past[g.past.length - 1]));
      set(nodes.zone, "x", f(g.xHoy));
      set(nodes.zone, "width", f(g.right - g.xHoy));
      set(nodes.pendText, "transform", `translate(${f((g.xHoy + g.right) / 2)} ${f(g.base / 2)})`);
    };

    const applyTracks = (g: Geo) => {
      const nodes = n.current;
      const v = E.v;
      set(nodes.cPast, "width", f(Math.max(0, v.pastR) * (g.xHoy + 3)));
      set(nodes.cFut, "x", f(g.xHoy));
      set(nodes.cFut, "width", f(Math.max(0, v.futR) * (g.right - g.xHoy + 8)));
      nodes.pend?.setAttribute("opacity", v.pend.toFixed(3));
      nodes.hoy?.setAttribute("opacity", v.hoy.toFixed(3));
      nodes.over?.setAttribute("opacity", v.over.toFixed(3));
      nodes.ghosts?.setAttribute("opacity", v.ghost.toFixed(3));
      nodes.err?.setAttribute("opacity", v.err.toFixed(3));
      nodes.end?.setAttribute("opacity", (v.futR >= 0.98 ? 1 : 0).toString());
    };

    const placeCursor = (x: number) => {
      const nodes = n.current;
      const g = E.geo;
      if (!g) return;
      set(nodes.cursor, "transform", `translate(${f(x)} 0)`);
      set(nodes.veil, "x", f(x));
      set(nodes.veil, "width", f(Math.max(0, g.xHoy - x)));
      const flip = x > (g.left + g.xHoy) / 2;
      set(nodes.tag, "text-anchor", flip ? "end" : "start");
      set(nodes.tag, "x", flip ? "-8" : "8");
    };

    /** A new origin: the three attempts, worked out once, from the real values. */
    const startStep = (now: number) => {
      const L = E.layout;
      if (!L) return;
      const origin = E.origins[E.step];
      const attempts = attemptsAt(E.values, origin);
      E.attempts = attempts;
      E.stepStart = now;
      const nodes = n.current;
      const x0 = L.xOf(origin);
      const y0 = L.yOf(E.values[origin]);
      const xEnd = L.xOf(origin + attempts[0].values.length);
      for (let i = 0; i < 3; i++) {
        const a = attempts.find((t) => t.method === i);
        const el = nodes[`g${i}`];
        if (!el) continue;
        if (!a) {
          el.setAttribute("d", "");
          continue;
        }
        let d = `M${f(x0)} ${f(y0)}`;
        a.values.forEach((v, j) => {
          d += `L${f(L.xOf(origin + j + 1))} ${f(L.yOf(v))}`;
        });
        el.setAttribute("d", d);
      }
      const best = attempts.reduce((b, a) => (a.error < b.error ? a : b), attempts[0]);
      E.best = best.method;
      let err = `M${f(x0)} ${f(y0)}`;
      best.values.forEach((v, j) => {
        err += `L${f(L.xOf(origin + j + 1))} ${f(L.yOf(v))}`;
      });
      for (let j = best.values.length; j >= 1; j--) err += `L${f(L.xOf(origin + j))} ${f(L.yOf(E.values[origin + j]))}`;
      nodes.err?.setAttribute("d", `${err}Z`);
      set(nodes.cGhost, "x", f(x0));
      set(nodes.cGhost, "width", "0");
      set(nodes.cGhost, "data-to", f(xEnd - x0));
      E.v.err = 0;
      for (let i = 0; i < 3; i++) nodes[`g${i}`]?.classList.remove("hz-best");
      legend.current?.querySelectorAll("[data-m]").forEach((li) => li.removeAttribute("data-best"));
      if (nodes.tagT) nodes.tagT.textContent = `Si hoy fuera ${E.labels[origin]}`;
    };

    const rehearse = (now: number): boolean => {
      if (!E.running) return false;
      const L = E.layout;
      if (!L) return true;
      const v = E.v;
      if (now < E.readUntil) {
        // Reading: the line is drawn again, with the cursor at its front.
        const t = 1 - (E.readUntil - now) / READ_MS;
        v.pastR = easeInOut(Math.min(1, t));
        placeCursor(lerp(L.geo.left, L.geo.xHoy, v.pastR));
        return true;
      }
      v.pastR = 1;
      // A new product is on its way, or the line is still settling on it.
      if (E.waitingLayout || now < E.pauseUntil) return true;
      if (E.origins.length === 0) {
        // Too little history to test: the line waits for the result.
        if (E.settle && now - E.startedAt >= MIN_REHEARSAL_MS) finishRehearsal();
        return E.running;
      }
      if (E.step < 0) {
        E.step = 0;
        v.ghost = 1;
        startStep(now);
      }
      const old = now - E.startedAt >= MIN_REHEARSAL_MS;
      const dur = E.settle && old ? STEP_HURRY_MS : STEP_MS;
      const t = (now - E.stepStart) / dur;
      const origin = E.origins[E.step];
      const prevX = E.step > 0 ? L.xOf(E.origins[E.step - 1]) : L.geo.xHoy;
      const x = lerp(prevX, L.xOf(origin), easeOut(Math.min(1, t / 0.4)));
      placeCursor(x);
      const nodes = n.current;
      const reveal = easeOut(Math.max(0, Math.min(1, (t - 0.15) / 0.5)));
      const to = Number(nodes.cGhost?.getAttribute("data-to") ?? 0);
      nodes.cGhost?.setAttribute("x", f(x));
      nodes.cGhost?.setAttribute("width", f(reveal * to));
      if (t >= 0.65) {
        v.err = Math.min(1, (t - 0.65) / 0.25);
        const el = nodes[`g${E.best}`];
        if (el && !el.classList.contains("hz-best")) {
          el.classList.add("hz-best");
          legend.current?.querySelector(`[data-m="${E.best}"]`)?.setAttribute("data-best", "");
        }
      }
      if (t >= 1) {
        E.step += 1;
        if (E.step >= E.origins.length) {
          if (E.settle && old) finishRehearsal();
          else {
            // Next pass: another real product. The new layout starts the steps again.
            E.step = -1;
            E.waitingLayout = true;
            v.err = 0;
            v.ghost = 0;
            advancePass.current();
            if (passCount <= 1) {
              E.waitingLayout = false;
              E.pauseUntil = now + 240;
            }
          }
        } else startStep(now);
      }
      return E.running;
    };

    const finishRehearsal = () => {
      E.running = false;
      E.settled = true;
      E.v.ghost = 0;
      E.v.err = 0;
      E.v.over = 0;
      E.v.pastR = 1;
      E.onSettled();
    };

    loop.current = (now: number) => {
      E.raf = 0;
      let busy = false;

      if (E.morphTo && E.morphFrom) {
        const t = Math.min(1, (now - E.morphStart) / MORPH_MS);
        const k = easeInOut(t);
        const a = E.morphFrom;
        const b = E.morphTo;
        const g: Geo = {
          left: lerp(a.left, b.left, k),
          right: lerp(a.right, b.right, k),
          base: lerp(a.base, b.base, k),
          xHoy: lerp(a.xHoy, b.xHoy, k),
          past: b.past.map((y, i) => lerp(a.past[i], y, k)),
          fut: b.fut.map((y, i) => lerp(a.fut[i], y, k)),
          lo: b.lo.map((y, i) => lerp(a.lo[i], y, k)),
          hi: b.hi.map((y, i) => lerp(a.hi[i], y, k)),
        };
        E.geo = g;
        drawGeo(g);
        placeHoy(g);
        if (t >= 1) {
          E.geo = b;
          E.morphTo = null;
          E.morphFrom = null;
          E.wroteExact = false;
        } else busy = true;
      }

      for (const [key, tr] of Object.entries(E.tracks)) {
        const t = (now - tr.start) / tr.dur;
        if (t < 0) {
          busy = true;
          continue;
        }
        E.v[key] = lerp(tr.from, tr.to, tr.ease(Math.min(1, t)));
        if (t >= 1) delete E.tracks[key];
        else busy = true;
      }

      if (rehearse(now)) busy = true;
      if (E.geo) applyTracks(E.geo);

      if (!E.morphTo && !E.wroteExact && E.exact) {
        const nodes = n.current;
        set(nodes.pLine, "d", E.exact.d.past);
        set(nodes.pArea, "d", E.exact.d.area);
        set(nodes.fLine, "d", E.exact.d.fut);
        set(nodes.fBand, "d", E.exact.d.band);
        E.wroteExact = true;
      }

      if (busy) E.raf = requestAnimationFrame(loop.current);
    };
    return () => {
      cancelAnimationFrame(E.raf);
      E.raf = 0;
    };
  }, [passCount]);

  const wake = () => {
    const E = engine.current;
    if (!E.raf) E.raf = requestAnimationFrame((t) => loop.current(t));
  };

  const animate = (key: string, to: number, dur: number, delay = 0, ease = easeOut) => {
    const E = engine.current;
    const now = performance.now();
    if (still || dur === 0) {
      delete E.tracks[key];
      E.v[key] = to;
      return;
    }
    E.tracks[key] = { from: E.v[key] ?? 0, to, start: now + delay, dur, ease };
  };

  // The data or the size changed: go there. The first time, draw it in.
  const hadFuture = useRef(false);
  useEffect(() => {
    if (!layout) return;
    const E = engine.current;
    const first = !E.geo;
    E.layout = layout;
    E.exact = layout;
    E.wroteExact = false;

    if (first || still) {
      E.geo = layout.geo;
      E.morphFrom = null;
      E.morphTo = null;
      const nodes = n.current;
      nodes.pLine?.setAttribute("d", layout.d.past);
      nodes.pArea?.setAttribute("d", layout.d.area);
      nodes.fLine?.setAttribute("d", layout.d.fut);
      nodes.fBand?.setAttribute("d", layout.d.band);
      nodes.hoy?.setAttribute("transform", `translate(${f(layout.geo.xHoy)} 0)`);
      nodes.hoyDot?.setAttribute("cy", f(layout.geo.past[SAMPLES_PAST - 1]));
      nodes.hoyPing?.setAttribute("cy", f(layout.geo.past[SAMPLES_PAST - 1]));
      nodes.zone?.setAttribute("x", f(layout.geo.xHoy));
      nodes.zone?.setAttribute("width", f(layout.geo.right - layout.geo.xHoy));
      nodes.pendText?.setAttribute("transform", `translate(${f((layout.geo.xHoy + layout.geo.right) / 2)} ${f(layout.geo.base / 2)})`);
      E.v.pastR = 0;
      animate("pastR", 1, 1050, 60, easeInOut);
      animate("hoy", 1, 320, 760);
      if (layout.hasFuture) {
        E.v.futR = 0;
        animate("futR", 1, 780, 900, easeInOut);
        E.v.pend = 0;
      } else {
        E.v.futR = 0;
        animate("pend", 1, 500, 820);
      }
      hadFuture.current = layout.hasFuture;
    } else {
      E.morphFrom = E.geo;
      E.morphTo = layout.geo;
      E.morphStart = performance.now();
      if (layout.hasFuture && !hadFuture.current) {
        // The result is born at today's point: it opens to the right as the band unfolds.
        E.v.futR = 0;
        animate("futR", 1, 900, 120, easeInOut);
        animate("pend", 0, 220);
      } else if (!layout.hasFuture && hadFuture.current) {
        animate("futR", 0, 240);
        if (!pass) animate("pend", 1, 360, 120);
      } else if (layout.hasFuture) {
        E.v.futR = 1;
      } else if (!pass) {
        animate("pend", 1, 300);
      }
      hadFuture.current = layout.hasFuture;
    }
    wake();
    // `animate` and `wake` only touch refs; `still` and `pass` are read as they are now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Rehearsal on and off.
  useEffect(() => {
    const E = engine.current;
    if (rehearsing && !E.running) {
      E.running = true;
      E.settled = false;
      E.startedAt = performance.now();
      E.step = -1;
      E.readUntil = performance.now() + READ_MS;
      E.waitingLayout = false;
      animate("over", 1, 200);
      animate("pend", 1, 300);
      animate("futR", 0, 200);
      wake();
    } else if (!rehearsing && E.running) {
      E.running = false;
      animate("over", 0, 200);
      wake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehearsing]);

  // A new pass: the series changed under the cursor. Its numbers, then the steps again.
  useEffect(() => {
    const E = engine.current;
    if (!pass) return;
    E.values = pass.points.map((p) => p.value);
    E.labels = pass.points.map((p) => p.label);
    E.origins = originsOf(pass.points.length);
    if (E.waitingLayout) {
      E.waitingLayout = false;
      E.step = -1;
      E.v.ghost = 0;
      E.pauseUntil = performance.now() + MORPH_MS * 0.6;
    }
    wake();
     
  }, [pass]);

  // `settle` may arrive while the loop sleeps.
  useEffect(() => {
    if (settle) wake();
     
  }, [settle]);

  // Not rehearsing at all (too little to show, or less motion): nothing to wait for.
  useEffect(() => {
    if (settle && !rehearsing) onSettled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settle, rehearsing]);

  const notifyPass = useRef(onPassChange);
  useEffect(() => {
    notifyPass.current = onPassChange;
  });
  useEffect(() => {
    notifyPass.current?.(pass);
  }, [pass]);

  /* ── The cursor ─────────────────────────────────────────────────────────── */
  const [cursor, setCursor] = useState<number | null>(null);
  const points = layout?.points ?? [];
  const canScrub = interactive && !rehearsing && points.length > 0;
  const at = cursor != null ? points[cursor] : null;

  const report = useRef(onScrub);
  useEffect(() => {
    report.current = onScrub;
  });
  useEffect(() => {
    report.current(at ? { point: at.point, future: at.future } : null);
    // Only the period matters: the object changes with every layout.
  }, [at?.point.date]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!canScrub) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    let best = 0;
    let dist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setCursor((c) => (c === best ? c : best));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!canScrub) return;
    const lastIndex = points.length - 1;
    const from = cursor ?? lastIndex;
    let to: number | null = null;
    if (e.key === "ArrowLeft") to = Math.max(0, from - 1);
    else if (e.key === "ArrowRight") to = Math.min(lastIndex, from + 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = lastIndex;
    else if (e.key === "Escape") {
      setCursor(null);
      return;
    }
    if (to != null) {
      e.preventDefault();
      setCursor(to);
    }
  };

  const valueText = at ? `${at.point.label}: ${at.future ? "≈ " : ""}${formatNumber(Math.round(at.point.value))} unidades` : "Sin mes elegido";
  const zoneWide = layout ? layout.geo.right - layout.geo.xHoy > 130 : false;
  const line = "rgb(var(--c-text-secondary))";
  const accent = "rgb(var(--c-accent-text))";

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div
        ref={box}
        data-look="chart"
        role={canScrub ? "slider" : undefined}
        tabIndex={canScrub ? 0 : undefined}
        aria-label={canScrub ? "Mes del gráfico: lo que vendiste y lo que viene" : undefined}
        aria-valuemin={canScrub ? 0 : undefined}
        aria-valuemax={canScrub ? points.length - 1 : undefined}
        aria-valuenow={canScrub ? (cursor ?? points.length - 1) : undefined}
        aria-valuetext={canScrub ? valueText : undefined}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setCursor(null)}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") setCursor(null);
        }}
        onKeyDown={onKey}
        onBlur={() => setCursor(null)}
        className={cn(
          "relative min-h-0 flex-1 touch-pan-y select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          canScrub && "cursor-crosshair",
        )}
      >
        <svg ref={svg} aria-hidden width={size.w} height={size.h} className="absolute inset-0 overflow-visible">
          <defs>
            <clipPath id={`${uid}-past`}>
              <rect data-n="cPast" x={0} y={-10} width={0} height={size.h + 20} />
            </clipPath>
            <clipPath id={`${uid}-fut`}>
              <rect data-n="cFut" x={0} y={-10} width={0} height={size.h + 20} />
            </clipPath>
            <clipPath id={`${uid}-ghost`}>
              <rect data-n="cGhost" x={0} y={-10} width={0} height={size.h + 20} />
            </clipPath>
            <pattern id={`${uid}-hatch`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="9" stroke="rgb(var(--c-text-muted) / 0.2)" strokeWidth="1.5" />
            </pattern>
            <pattern id={`${uid}-veil`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
              <line x1="0" y1="0" x2="0" y2="10" stroke="rgb(var(--c-primary) / 0.22)" strokeWidth="4" />
            </pattern>
          </defs>

          {layout?.ticks.map((t) => (
            <g key={t.v}>
              <line x1={layout.geo.left} x2={layout.geo.right} y1={t.y} y2={t.y} stroke="rgb(var(--c-text-muted) / 0.14)" />
              <text x={layout.geo.left - 8} y={t.y + 4} textAnchor="end" className="fill-text-muted text-[11px] tabular-nums">
                {formatNumber(t.v)}
              </text>
            </g>
          ))}
          {layout?.xLabels.map((l) => (
            <text
              key={l.label}
              x={l.x}
              y={layout.geo.base + 18}
              textAnchor={l.x > layout.geo.right - 20 ? "end" : "middle"}
              className={cn("text-[11px]", l.future ? "fill-accent-text font-medium" : "fill-text-muted")}
            >
              {l.label}
            </text>
          ))}

          {/* The zone the forecast will fill. */}
          <g data-n="pend" opacity={0}>
            <rect data-n="zone" y={24} height={Math.max(0, size.h - 50)} fill={`url(#${uid}-hatch)`} rx={10} />
            <g data-n="pendText">
              {zoneWide && (
                <text textAnchor="middle" className="fill-text-muted text-[12.5px] font-medium">
                  Aquí va lo que viene
                </text>
              )}
            </g>
          </g>

          <g clipPath={`url(#${uid}-past)`}>
            <path data-n="pArea" fill="rgb(var(--c-text) / 0.045)" />
            <path data-n="pLine" fill="none" stroke={line} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <g clipPath={`url(#${uid}-fut)`}>
            <path data-n="fBand" fill="rgb(var(--c-primary) / 0.2)" />
            <path data-n="fLine" fill="none" stroke={accent} strokeWidth={2.25} strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Today. */}
          <g data-n="hoy" opacity={0}>
            <line x1={0} x2={0} y1={18} y2={Math.max(0, size.h - 26)} stroke="rgb(var(--c-text-muted) / 0.45)" strokeDasharray="2 4" />
            <text x={0} y={12} textAnchor="middle" className="fill-text-secondary text-[11.5px] font-semibold">
              Hoy
            </text>
            <circle data-n="hoyPing" r={5} fill="rgb(var(--c-primary))" className="hz-ping" />
            <circle data-n="hoyDot" r={5} fill="rgb(var(--c-primary))" stroke="rgb(var(--c-surface))" strokeWidth={2} />
          </g>

          {/* Where the forecast ends: its one direct label. */}
          <g data-n="end" opacity={0} className="transition-opacity duration-300">
            {layout?.end && (
              <>
                <circle cx={layout.end.x} cy={layout.end.y} r={4.5} fill={accent} stroke="rgb(var(--c-surface))" strokeWidth={2} />
                <text x={layout.end.x - 8} y={Math.max(14, layout.end.y - 12)} textAnchor="end" className="hz-halo fill-text-primary text-[12.5px] font-semibold tabular-nums">
                  ≈ {formatNumber(Math.round(layout.end.value))}
                </text>
              </>
            )}
          </g>

          {/* The rehearsal: what bria. may not see, its attempts and how far off the closest one was. */}
          <g data-n="over" opacity={0}>
            <rect data-n="veil" y={24} height={Math.max(0, size.h - 50)} fill={`url(#${uid}-veil)`} />
            <g data-n="ghosts" opacity={0} clipPath={`url(#${uid}-ghost)`}>
              <path data-n="err" fill="rgb(var(--c-primary) / 0.3)" />
              <path data-n="g0" data-ghost className="hz-ghost" fill="none" strokeDasharray="2 4" />
              <path data-n="g1" data-ghost className="hz-ghost" fill="none" strokeDasharray="7 4" />
              <path data-n="g2" data-ghost className="hz-ghost" fill="none" />
            </g>
            <g data-n="cursor">
              <line x1={0} x2={0} y1={24} y2={Math.max(0, size.h - 26)} stroke="rgb(var(--c-accent-text))" strokeWidth={1.5} />
              <text data-n="tag" y={38} className="hz-halo fill-text-primary text-[12px] font-semibold">
                <tspan data-n="tagT" />
              </text>
            </g>
          </g>

          {at && layout && (
            <g pointerEvents="none">
              <line x1={at.x} x2={at.x} y1={24} y2={layout.geo.base} stroke="rgb(var(--c-text-muted) / 0.55)" />
              <circle cx={at.x} cy={at.y} r={5} fill={at.future ? accent : line} stroke="rgb(var(--c-surface))" strokeWidth={2} />
            </g>
          )}
        </svg>
      </div>

      {/* Same height either way: the frame doesn't move when the rehearsal starts or ends. */}
      {rehearsing ? (
        <ul ref={legend} className="hz-legend flex min-h-5 flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-text-muted">
          {ATTEMPT_NAMES.map((name, i) => (
            <li key={name} data-m={i} className="flex items-center gap-2 transition-colors duration-150">
              <svg aria-hidden width="22" height="4">
                <line x1="1" x2="21" y1="2" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={i === 0 ? "2 4" : i === 1 ? "7 4" : undefined} />
              </svg>
              {name}
            </li>
          ))}
          <li className="ml-auto hidden text-[12px] lg:block">Una muestra: el motor hace estas pruebas con cada producto.</li>
        </ul>
      ) : (
        <ul className={cn("flex min-h-5 flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-text-muted", !layout && "invisible")}>
          <li className="flex items-center gap-2">
            <svg aria-hidden width="22" height="4">
              <line x1="1" x2="21" y1="2" y2="2" stroke={line} strokeWidth="2" strokeLinecap="round" />
            </svg>
            Lo que vendiste
          </li>
          {layout?.hasFuture && (
            <>
              <li className="flex items-center gap-2">
                <svg aria-hidden width="22" height="4">
                  <line x1="1" x2="21" y1="2" y2="2" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeDasharray="6 5" />
                </svg>
                Pronóstico
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-[22px] rounded-sm bg-primary/25" />
                Rango probable
              </li>
              {canScrub && <li className="ml-auto hidden text-[12px] lg:block">Pasa el cursor por un mes para ver su cifra.</li>}
            </>
          )}
        </ul>
      )}

      {/* The same figures, as a table. */}
      {!pass && rest && (
        <table className="sr-only">
          <caption>Unidades por periodo</caption>
          <thead>
            <tr>
              <th scope="col">Periodo</th>
              <th scope="col">Vendiste</th>
              <th scope="col">Pronóstico</th>
            </tr>
          </thead>
          <tbody>
            {rest.past.map((p) => (
              <tr key={p.date}>
                <th scope="row">{p.label}</th>
                <td>{formatNumber(Math.round(p.value))}</td>
                <td />
              </tr>
            ))}
            {rest.future.map((p) => (
              <tr key={p.date}>
                <th scope="row">{p.label}</th>
                <td />
                <td>≈ {formatNumber(Math.round(p.value))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
