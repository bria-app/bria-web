"use client";

import { useState } from "react";
import { Check, Loader2, Shapes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { companiesApi } from "@/services/api/resources";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES } from "./businesses";
import { StepActions, StepHeading } from "./StepHeading";

interface BusinessStepProps {
  companyId: string | null;
  /** The company's saved `business_type`. */
  current: string | null;
  onSaved: () => void;
  onBack: () => void;
  onNext: () => void;
}

const KNOWN = new Set(BUSINESS_TYPES.map((b) => b.label));

/** What kind of shop this is. Saved on the company; it drives the suggestions of the next steps. */
export function BusinessStep({ companyId, current, onSaved, onBack, onNext }: BusinessStepProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(!!current && !KNOWN.has(current));
  const [other, setOther] = useState(current && !KNOWN.has(current) ? current : "");

  const save = async (label: string, advance: boolean) => {
    if (!companyId || !label.trim()) return;
    setSaving(label);
    setError(null);
    try {
      await companiesApi.update(companyId, { business_type: label.trim() });
      onSaved();
      if (advance) onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar tu rubro.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker="Paso 1 · Rubro"
        title="¿Qué vendes?"
        text="Elige el rubro que más se parezca al tuyo. Con eso te sugerimos tipos de producto y columnas que de verdad vas a usar."
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {BUSINESS_TYPES.map((b) => {
          const on = current === b.label;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => void save(b.label, true)}
              aria-pressed={on}
              disabled={saving !== null}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border bg-surface p-3.5 text-left transition-[border-color,transform] active:scale-[0.99]",
                on ? "border-strong ring-1 ring-strong" : "border-border hover:border-text-muted/50",
              )}
            >
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors", on ? "bg-strong text-strong-foreground" : "bg-surface-muted text-text-secondary group-hover:text-text-primary")}>
                <b.icon aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold text-text-primary">{b.label}</span>
                <span className="block truncate text-[13px] text-text-secondary">{b.tagline}</span>
              </span>
              {saving === b.label ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin text-text-muted" />
              ) : (
                on && <Check aria-hidden className="h-4 w-4 text-text-primary" />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOtherOpen(true)}
          aria-expanded={otherOpen}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-dashed bg-transparent p-3.5 text-left transition-colors",
            otherOpen ? "border-strong" : "border-border hover:border-text-muted/50",
          )}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-text-secondary">
            <Shapes aria-hidden className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[14.5px] font-semibold text-text-primary">Otro rubro</span>
            <span className="block text-[13px] text-text-secondary">Escríbelo con tus palabras</span>
          </span>
        </button>
      </div>

      {otherOpen && (
        <form
          className="pop-in flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void save(other, true);
          }}
        >
          <TextField
            label="Tu rubro"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Ej. Juguetería, Óptica, Repuestos de moto"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" variant="strong" loading={saving === other} disabled={!other.trim()}>
            Guardar rubro
          </Button>
        </form>
      )}

      <StepActions onBack={onBack} onNext={onNext} nextLabel={current ? "Continuar" : "Seguir sin elegir"} quiet={!current} loading={saving !== null} />
    </div>
  );
}
