"use client";

import { useCallback, useRef, useState } from "react";
import { limaDate } from "@/lib/lima";
import { Calendar } from "./Calendar";
import { Chip } from "./Chip";
import { DatePopover, popoverHost } from "./DatePopover";

interface DateRangeChipProps {
  /** This chip is the period in use. */
  active: boolean;
  from: string;
  to: string;
  /** Picked while another period was in use. */
  onSelect: () => void;
  onChange: (range: { from: string; to: string }) => void;
  /** Last day that can be picked (today, when nothing can be dated later). */
  max?: string;
}

const short = (iso: string) =>
  new Date(`${iso}T12:00:00Z`)
    .toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(/\./g, "")
    .replace(/ de /g, " ");

/** «3/1/24», short enough for a chip next to the other periods. */
const numeric = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}/${iso.slice(2, 4)}`;

function rangeLabel(from: string, to: string): string {
  if (!from || !to) return "Elegir fechas";
  const thisYear = limaDate(new Date()).slice(0, 4);
  if (from.slice(0, 4) === thisYear && to.slice(0, 4) === thisYear) return `${short(from)} – ${short(to)}`;
  return `${numeric(from)} – ${numeric(to)}`;
}

/**
 * The «Elegir fechas» filter: a chip that opens the calendar in a floating panel, so choosing a
 * period never moves what is on the page, and then shows the period chosen. Two clicks pick it: the
 * first and the last day, in any order.
 */
export function DateRangeChip({ active, from, to, onSelect, onChange, max }: DateRangeChipProps) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  const close = useCallback((refocus: boolean) => {
    setHost(null);
    if (refocus) anchor.current?.querySelector("button")?.focus();
  }, []);

  return (
    <span ref={anchor} className="inline-flex">
      <Chip
        active={active}
        expanded={host !== null}
        onClick={() => {
          if (!active) onSelect();
          setHost(host ? null : popoverHost(anchor.current));
        }}
      >
        {active ? rangeLabel(from, to) : "Elegir fechas"}
      </Chip>
      <DatePopover anchor={anchor} host={host} onClose={close} label="Elegir fechas">
        <Calendar
          range
          from={active ? from || undefined : undefined}
          to={active ? to || undefined : undefined}
          max={max ?? limaDate(new Date())}
          onPick={(first, last) => {
            onChange({ from: first, to: last });
            close(true);
          }}
        />
      </DatePopover>
    </span>
  );
}
