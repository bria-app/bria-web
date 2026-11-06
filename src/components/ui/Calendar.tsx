"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { limaDate, shiftDate } from "@/lib/lima";
import { cn } from "@/lib/utils";

const WEEK = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const isoOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const yearOf = (iso: string) => Number(iso.slice(0, 4));
const monthOf = (iso: string) => Number(iso.slice(5, 7)) - 1;
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** The same day of a month `delta` away, or that month's last day if it is shorter. */
function shiftMonth(iso: string, delta: number): string {
  const total = yearOf(iso) * 12 + monthOf(iso) + delta;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  return isoOf(year, month, Math.min(Number(iso.slice(8, 10)), daysIn(year, month)));
}

interface CalendarProps {
  /** Chosen day, or the first day of the chosen range. */
  from?: string;
  /** Last day of the chosen range. */
  to?: string;
  /** Pick two days (a period) instead of one. */
  range?: boolean;
  min?: string;
  max?: string;
  /** A finished pick: the two days in order, the same one twice when picking a single day. */
  onPick: (from: string, to: string) => void;
  /** Offers «Borrar» to leave the date empty. */
  onClear?: () => void;
}

/**
 * The app's own calendar, with the arrow keys moving through the days and the title opening the
 * months. Always six rows of days, so moving between months never changes its height.
 */
export function Calendar({ from, to, range, min, max, onPick, onClear }: CalendarProps) {
  const today = limaDate(new Date());
  const start = to || from || (max && max < today ? max : today);
  const [view, setView] = useState({ year: yearOf(start), month: monthOf(start) });
  const [months, setMonths] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState(start);
  const moved = useRef(false);
  const grid = useRef<HTMLDivElement>(null);

  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max);
  const cells = useMemo(() => {
    const first = isoOf(view.year, view.month, 1);
    const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => shiftDate(first, i - offset));
  }, [view]);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus, view]);

  const goMonth = (delta: number) => {
    const next = shiftMonth(isoOf(view.year, view.month, 1), delta);
    setView({ year: yearOf(next), month: monthOf(next) });
  };
  const lastDay = (year: number, month: number) => isoOf(year, month, daysIn(year, month));
  const canMonth = (year: number, month: number) => (!max || isoOf(year, month, 1) <= max) && (!min || lastDay(year, month) >= min);
  const prevAt = shiftMonth(isoOf(view.year, view.month, 1), -1);
  const nextAt = shiftMonth(isoOf(view.year, view.month, 1), 1);

  const choose = (iso: string) => {
    if (!allowed(iso)) return;
    if (!range) return onPick(iso, iso);
    if (!picking) {
      setPicking(iso);
      setHover(iso);
      return;
    }
    setPicking(null);
    onPick(iso < picking ? iso : picking, iso < picking ? picking : iso);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | null = null;
    if (e.key in steps) next = shiftDate(focus, steps[e.key]);
    else if (e.key === "PageUp") next = shiftMonth(focus, -1);
    else if (e.key === "PageDown") next = shiftMonth(focus, 1);
    if (!next) return;
    e.preventDefault();
    if (!allowed(next)) return;
    moved.current = true;
    setFocus(next);
    if (picking) setHover(next);
    setView({ year: yearOf(next), month: monthOf(next) });
  };

  // The day the keyboard lands on: the last one it was on, or the first one that can be picked.
  const tabbable = cells.includes(focus) && allowed(focus) ? focus : cells.find((d) => monthOf(d) === view.month && allowed(d));

  // While picking, the range previews up to the day under the pointer.
  const a = picking ?? from ?? "";
  const b = picking ? (hover ?? picking) : range ? (to ?? "") : (from ?? "");
  const low = a && b ? (a < b ? a : b) : a;
  const high = a && b ? (a < b ? b : a) : a;

  const arrow = "grid h-9 w-9 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="w-[280px]">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-expanded={months}
          onClick={() => setMonths((v) => !v)}
          className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-sm font-semibold capitalize text-text-primary transition-colors hover:bg-surface-muted"
        >
          {months ? view.year : `${MONTHS[view.month]} ${view.year}`}
          <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 text-text-muted transition-transform duration-200", months && "rotate-180")} />
        </button>
        <div className="flex">
          <button
            type="button"
            aria-label={months ? "Año anterior" : "Mes anterior"}
            disabled={months ? !!min && view.year <= yearOf(min) : !canMonth(yearOf(prevAt), monthOf(prevAt))}
            onClick={() => (months ? setView((v) => ({ ...v, year: v.year - 1 })) : goMonth(-1))}
            className={arrow}
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={months ? "Año siguiente" : "Mes siguiente"}
            disabled={months ? !!max && view.year >= yearOf(max) : !canMonth(yearOf(nextAt), monthOf(nextAt))}
            onClick={() => (months ? setView((v) => ({ ...v, year: v.year + 1 })) : goMonth(1))}
            className={arrow}
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>

      {months ? (
        <div className="grid h-[268px] grid-cols-3 content-start gap-1.5 pt-1">
          {MONTHS.map((name, m) => (
            <button
              key={name}
              type="button"
              disabled={!canMonth(view.year, m)}
              onClick={() => {
                setView((v) => ({ ...v, month: m }));
                setMonths(false);
              }}
              className={cn(
                "h-12 rounded-xl text-[13px] font-medium capitalize transition-colors disabled:pointer-events-none disabled:opacity-30",
                m === view.month ? "bg-strong text-strong-foreground" : "text-text-primary hover:bg-surface-muted",
              )}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      ) : (
        <div
          ref={grid}
          role="grid"
          aria-label={`${MONTHS[view.month]} ${view.year}`}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHover(picking)}
          className="h-[268px]"
        >
          <div role="row" className="grid h-7 grid-cols-7 items-center">
            {WEEK.map((d) => (
              <span key={d} role="columnheader" className="text-center text-[11.5px] font-medium text-text-muted">
                {d}
              </span>
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} role="row" className="grid h-10 grid-cols-7">
              {cells.slice(row * 7, row * 7 + 7).map((day) => {
                const outside = monthOf(day) !== view.month;
                const can = allowed(day);
                const end = day === low || day === high;
                const inside = !!low && !!high && low !== high && day >= low && day <= high;
                return (
                  <div key={day} role="gridcell" aria-selected={end || inside} className="relative grid place-items-center">
                    {inside && (
                      <span
                        aria-hidden
                        className={cn("absolute inset-y-0.5 bg-primary-soft", day === low ? "left-1/2 right-0" : day === high ? "left-0 right-1/2" : "inset-x-0")}
                      />
                    )}
                    <button
                      type="button"
                      data-day={day}
                      tabIndex={day === tabbable ? 0 : -1}
                      disabled={!can}
                      aria-current={day === today ? "date" : undefined}
                      aria-label={day}
                      onClick={() => choose(day)}
                      onMouseEnter={() => picking && setHover(day)}
                      className={cn(
                        "relative grid h-9 w-9 place-items-center rounded-full text-[13px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:pointer-events-none",
                        end ? "bg-strong font-semibold text-strong-foreground" : "hover:bg-surface-muted",
                        !end && (outside || !can ? "text-text-muted" : "text-text-primary"),
                        !can && "opacity-40",
                        !end && day === today && "font-bold text-accent-text",
                      )}
                    >
                      {Number(day.slice(8, 10))}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex h-8 items-center justify-between gap-2 border-t border-border pt-2 text-[12.5px]">
        <span className="min-w-0 truncate text-text-secondary">{range ? (picking ? "Ahora elige el último día" : "Elige el primer día") : ""}</span>
        <span className="flex shrink-0 gap-3">
          {onClear && (
            <button type="button" onClick={onClear} className="rounded font-semibold text-text-secondary hover:text-text-primary">
              Borrar
            </button>
          )}
          {!range && allowed(today) && (
            <button type="button" onClick={() => onPick(today, today)} className="rounded font-semibold text-accent-text hover:underline">
              Hoy
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
