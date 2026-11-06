"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  /** Muted help shown under the field while there is no error. */
  hint?: string;
  /** Validation message; also marks the input as invalid for assistive tech. */
  error?: string | null;
  /** Leading adornment such as an icon or "S/". */
  prefix?: React.ReactNode;
  /** Trailing adornment such as a show-password toggle. */
  suffix?: React.ReactNode;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
}

/**
 * Labelled input with hint and error. The label is always present in the DOM; the error is
 * announced through `aria-describedby` and `aria-invalid`.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, prefix, suffix, hideLabel, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error || hint;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={cn("text-[13px] font-semibold text-text-secondary", hideLabel && "sr-only")}>
        {label}
      </label>
      <div
        className={cn(
          "flex h-12 items-center gap-2.5 rounded-xl border bg-surface px-3.5 transition-colors",
          "focus-within:border-accent-text focus-within:ring-4 focus-within:ring-primary/20",
          error ? "border-danger" : "border-border hover:border-text-muted/50",
        )}
      >
        {prefix && <span className="flex shrink-0 items-center text-text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          // w-0: an <input> otherwise keeps the browser's ~20-character width and pushes narrow grids open.
          className="h-full w-0 min-w-0 flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted"
          {...props}
        />
        {suffix && <span className="flex shrink-0 items-center">{suffix}</span>}
      </div>
      {message && (
        <p id={messageId} className={cn("text-[12.5px] leading-snug", error ? "text-danger" : "text-text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
});
