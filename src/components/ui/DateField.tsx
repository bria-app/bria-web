"use client";

import { useCallback, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { Calendar } from "./Calendar";
import { DatePopover, popoverHost } from "./DatePopover";

interface DateFieldProps {
  /** «2026-11-05», or empty. */
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  /** Offers «Borrar» in the calendar. */
  clearable?: boolean;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

const display = (iso: string) =>
  new Date(`${iso}T12:00:00Z`)
    .toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .replace(/\./g, "")
    .replace(/ de /g, " ");

/** A date in a form: looks like the other fields and opens the app's own calendar. */
export function DateField({
  value,
  onChange,
  min,
  max,
  clearable,
  id,
  disabled,
  invalid,
  onBlur,
  className,
  placeholder = "Elegir fecha",
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: DateFieldProps) {
  const button = useRef<HTMLButtonElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const open = host !== null;

  const close = useCallback(
    (refocus: boolean) => {
      setHost(null);
      onBlur?.();
      if (refocus) button.current?.focus();
    },
    [onBlur],
  );

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onClick={() => (open ? close(false) : setHost(popoverHost(button.current)))}
        className={inputClass(invalid, cn("flex items-center justify-between gap-2 text-left", open && "border-accent-text ring-4 ring-primary/20", className))}
      >
        <span className={cn("min-w-0 truncate", !value && "text-text-muted")}>{value ? display(value) : placeholder}</span>
        <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-text-muted" />
      </button>
      <DatePopover anchor={button} host={host} onClose={close} label={ariaLabel ?? "Elegir fecha"}>
        <Calendar
          from={value || undefined}
          min={min}
          max={max}
          onPick={(day) => {
            onChange(day);
            close(true);
          }}
          onClear={
            clearable
              ? () => {
                  onChange("");
                  close(true);
                }
              : undefined
          }
        />
      </DatePopover>
    </>
  );
}
