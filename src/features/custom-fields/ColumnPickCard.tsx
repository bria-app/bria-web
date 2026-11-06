"use client";

import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CUSTOM_FIELD_TYPE_LABEL } from "@/types/custom-fields";
import { AlertBadges } from "./AlertBadges";
import { parseOptions, toAlert, toValidation, type ColumnDraft } from "./columnDraft";
import { validationParts } from "./ruleText";

interface ColumnPickCardProps {
  draft: ColumnDraft;
  /** «existing»: already saved; «preset»: suggested, can be ticked; «added»: created in this step. */
  kind: "existing" | "preset" | "added";
  picked?: boolean;
  /** Why a suggestion helps. */
  hint?: string;
  /** Changed in this step and not saved yet. */
  changed?: boolean;
  editing?: boolean;
  onToggle?: () => void;
  onEdit: () => void;
  onRemove?: () => void;
}

/** One column in a pick list: tick it, see its rules at a glance, open it to adjust. */
export function ColumnPickCard({ draft, kind, picked, hint, changed, editing, onToggle, onEdit, onRemove }: ColumnPickCardProps) {
  const on = kind !== "preset" || !!picked;
  const alert = toAlert(draft);
  const options = draft.field_type === "select" ? parseOptions(draft.options) : [];
  const rules = [draft.is_required && "Obligatoria", ...validationParts(draft.field_type, toValidation(draft))].filter(Boolean) as string[];
  const status = kind === "existing" ? (changed ? "Ya la tienes · con cambios" : "Ya la tienes") : kind === "added" ? "Nueva" : null;
  const sub = [status, hint && !rules.length ? hint : null, options.length ? options.join(", ") : null, ...rules].filter(Boolean).join(" · ");

  const box = (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
        kind === "existing" ? "border-success bg-success text-surface" : on ? "border-strong bg-strong text-strong-foreground" : "border-border",
      )}
    >
      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
  const text = (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-text-primary">
        <span className="min-w-0 break-words">{draft.label}</span>
        <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">{CUSTOM_FIELD_TYPE_LABEL[draft.field_type]}</span>
      </span>
      <span className="block text-[13px] text-text-muted">{sub}</span>
      {alert && on && (
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-text-muted">
          Te avisa <AlertBadges alerts={[{ key: "card", column: draft.label, label: alert.label, tone: alert.tone }]} withColumn={false} />
        </span>
      )}
    </span>
  );

  return (
    <div
      className={cn(
        "flex h-full items-start gap-1 rounded-2xl border bg-surface p-1.5 transition-colors",
        editing ? "border-accent-text ring-4 ring-primary/15" : kind === "existing" ? "border-success/40" : on ? "border-strong" : "border-border hover:border-text-muted/50",
      )}
    >
      {kind === "preset" ? (
        <button type="button" role="checkbox" aria-checked={on} onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-2 text-left">
          {box}
          {text}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 p-2">
          {box}
          {text}
        </div>
      )}
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={onEdit}
          aria-expanded={editing}
          aria-label={`Ajustar «${draft.label}»`}
          title="Ajustar"
          className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary"
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar «${draft.label}»`}
            title="Quitar"
            className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
