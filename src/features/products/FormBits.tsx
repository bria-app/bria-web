import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled block inside a long form or a sheet. */
export function FormSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Label + control + hint/error for controls that are not a TextField (Select, textarea,
 * custom fields). `htmlFor` must match the control's id when it is a native input.
 */
export function FieldShell({
  label,
  htmlFor,
  labelId,
  hint,
  error,
  messageId,
  badge,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelId?: string;
  hint?: string;
  error?: string;
  messageId?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const message = error || hint;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} id={labelId} className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary">
        {label}
        {badge}
      </label>
      {children}
      {message && (
        <p id={messageId} className={cn("text-[12.5px] leading-snug", error ? "text-danger" : "text-text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}
