"use client";

import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TextField } from "@/components/ui/TextField";
import { FieldShell } from "@/features/products/FormBits";
import type { AlertOp, AlertTone } from "@/types/custom-fields";
import { AlertBadges } from "./AlertBadges";
import { parseOptions, toAlert, type AlertDraft, type ColumnDraft, type ColumnDraftErrors } from "./columnDraft";
import { alertSentence, opLabel } from "./ruleText";
import { ALERT_OPS, MAX_ALERT_LABEL, defaultAlertLabel } from "./rules";

interface AlertEditorProps {
  draft: ColumnDraft;
  onChange: (next: AlertDraft) => void;
  errors: ColumnDraftErrors;
}

const TONES: { value: AlertTone; label: string }[] = [
  { value: "warning", label: "Aviso" },
  { value: "danger", label: "Urgente" },
];

const needsValue = (op: AlertOp) => op !== "empty" && op !== "past" && op !== "within_days";

/** «Avísame cuando…»: one condition that marks the product, with its label and tone, read back live. */
export function AlertEditor({ draft, onChange, errors }: AlertEditorProps) {
  const a = draft.alert;
  const type = draft.field_type;
  const set = (patch: Partial<AlertDraft>) => onChange({ ...a, ...patch });
  const column = draft.label.trim() || "la columna";
  const options = parseOptions(draft.options);
  const final = toAlert({ ...draft, alert: { ...a, on: true } });
  const ops = ALERT_OPS[type].map((op) => ({ value: op, label: opLabel(op, type) }));

  const valueControl = () => {
    if (!needsValue(a.op)) return null;
    if (type === "boolean") {
      return (
        <FieldShell label="Respuesta">
          <Segmented<"true" | "false">
            label="Respuesta que avisa"
            value={a.value === "false" ? "false" : "true"}
            options={[
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ]}
            onChange={(x) => set({ value: x })}
          />
        </FieldShell>
      );
    }
    if (type === "select") {
      return (
        <FieldShell label="Opción" error={errors.alert_value}>
          <Select
            aria-label="Opción que avisa"
            value={options.includes(a.value) ? a.value : ""}
            invalid={!!errors.alert_value}
            placeholder={options.length ? "Elige una opción" : "Primero escribe las opciones"}
            options={options.map((o) => ({ value: o, label: o }))}
            onChange={(x) => set({ value: x })}
          />
        </FieldShell>
      );
    }
    const numeric = type === "number" || type === "currency";
    return (
      <TextField
        label={numeric ? "Valor" : "Texto"}
        inputMode={numeric ? "decimal" : undefined}
        prefix={type === "currency" ? <span className="font-mono text-sm">S/</span> : undefined}
        className={numeric ? "[&_input]:font-mono" : undefined}
        placeholder={numeric ? "Ej. 5" : "Ej. Importado"}
        maxLength={numeric ? undefined : 120}
        value={a.value}
        error={errors.alert_value}
        onChange={(e) => set({ value: e.target.value })}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-text-primary">Avísame cuando…</p>
          <p className="text-[12.5px] text-text-muted">El producto se marca en tu inventario y en su ficha.</p>
        </div>
        <Switch label="Avisarme" checked={a.on} onChange={(on) => set({ on })} />
      </div>

      {a.on && (
        <div className="pop-in space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label={`«${column}»`}>
              <Select<AlertOp>
                aria-label={`Condición de «${column}»`}
                value={a.op}
                options={ops}
                onChange={(op) => set({ op, value: op === "eq" && type === "boolean" ? "true" : needsValue(op) ? a.value : "" })}
              />
            </FieldShell>
            {a.op === "within_days" ? (
              <TextField
                label="Con cuántos días"
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                suffix={<span className="text-[13px] text-text-muted">días antes</span>}
                className="[&_input]:font-mono"
                value={a.days}
                error={errors.alert_days}
                onChange={(e) => set({ days: e.target.value })}
              />
            ) : (
              valueControl()
            )}
          </div>
          {a.op === "within_days" && (
            <Switch showLabel label="Seguir avisando si la fecha ya pasó" checked={a.include_past} onChange={(include_past) => set({ include_past })} />
          )}

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <TextField
              label="Cómo se llama el aviso"
              maxLength={MAX_ALERT_LABEL}
              placeholder={defaultAlertLabel(a.op, draft.label, final?.value)}
              hint="Opcional. Corto: se ve junto al producto."
              value={a.label}
              error={errors.alert_label}
              onChange={(e) => set({ label: e.target.value })}
            />
            <FieldShell label="Tono">
              <Segmented<AlertTone> label="Tono del aviso" value={a.tone} options={TONES} onChange={(tone) => set({ tone })} />
            </FieldShell>
          </div>

          {final && (
            <p aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl bg-surface-soft px-3.5 py-3 text-[13.5px] text-text-secondary">
              <span>{alertSentence(column, type, final)}:</span>
              <AlertBadges alerts={[{ key: "preview", column: draft.label.trim(), label: final.label, tone: final.tone }]} withColumn={false} size="md" />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
