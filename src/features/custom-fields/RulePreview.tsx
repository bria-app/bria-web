"use client";

import { useId, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FieldShell } from "@/features/products/FormBits";
import type { CustomAttributes } from "@/types/custom-fields";
import { AlertBadges } from "./AlertBadges";
import { CustomFieldInput } from "./CustomFieldInput";
import { previewField, type ColumnDraft } from "./columnDraft";
import { validationParts } from "./ruleText";
import { alertFires, checkValue, isEmptyValue, limaToday } from "./rules";

interface RulePreviewProps {
  draft: ColumnDraft;
  alertsAllowed: boolean;
}

/**
 * «Pruébala»: the column as the product form will show it. Typing a value says right away
 * whether it can be saved and whether the alert would mark the product.
 */
export function RulePreview({ draft, alertsAllowed }: RulePreviewProps) {
  const id = useId();
  // The test value belongs to one type: switching type starts it over.
  const [test, setTest] = useState<{ type: string; value: CustomAttributes[string] }>({ type: draft.field_type, value: null });
  const value = test.type === draft.field_type ? test.value : null;
  const field = previewField(draft, alertsAllowed);
  const today = limaToday();
  const empty = isEmptyValue(value);
  const problem = empty ? (draft.is_required ? "Es obligatoria: hay que llenarla." : null) : checkValue(field.field_type, field.rules?.validation, value, today);
  const alert = field.rules?.alert;
  const fires = !!alert && alertFires(field.field_type, alert, value, today);
  const parts = [draft.is_required ? "Obligatoria" : "Opcional", ...validationParts(field.field_type, field.rules?.validation)];

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <p className="text-[13px] font-semibold text-text-primary">Pruébala</p>
        <p className="text-[12px] text-text-muted">Así se verá al crear un producto.</p>
      </div>
      <FieldShell label={field.label} htmlFor={`${id}-try`} hint={parts.join(" · ")}>
        <CustomFieldInput id={`${id}-try`} field={field} value={value} onChange={(v) => setTest({ type: draft.field_type, value: v })} invalid={!!problem && !empty} />
      </FieldShell>
      <div aria-live="polite" className="min-h-[22px] space-y-1.5 text-[12.5px]">
        {problem ? (
          <p className="text-danger">{problem}</p>
        ) : !empty ? (
          <p className="flex items-center gap-1.5 text-success">
            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> Se puede guardar.
          </p>
        ) : (
          <p className="text-text-muted">Escribe un valor de prueba.</p>
        )}
        {fires && alert && !problem && (
          <p className="flex flex-wrap items-center gap-1.5 text-text-secondary">
            {empty ? "Si la dejas vacía, verías" : "Con este valor verías"}
            <AlertBadges alerts={[{ key: "try", column: field.label, label: alert.label, tone: alert.tone }]} withColumn={false} />
          </p>
        )}
      </div>
    </div>
  );
}
