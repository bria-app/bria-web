"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ColumnPlanner } from "@/features/custom-fields/ColumnPlanner";
import { useColumnPlan, type PlanPreset } from "@/features/custom-fields/useColumnPlan";
import { categoriesApi } from "@/services/api/resources";
import { inputClass } from "@/lib/ui";
import type { CategoryDTO } from "@/types/api";
import type { CustomFieldDTO, CustomFieldRulesInput } from "@/types/custom-fields";
import { GENERIC_FIELDS, type BusinessType, type FieldPreset } from "./businesses";
import { StepActions, StepHeading } from "./StepHeading";

interface SetupStepProps {
  companyId: string | null;
  business: BusinessType | null;
  categories: CategoryDTO[];
  fields: CustomFieldDTO[];
  onSaved: () => void;
  onBack: () => void;
  onNext: () => void;
}

const norm = (s: string) => s.trim().toLocaleLowerCase("es");

/** Rules a suggested column starts with, because almost every shop wants them. All editable. */
const SUGGESTED_RULES: Record<string, CustomFieldRulesInput> = {
  "Fecha de vencimiento": { alert: { op: "within_days", days: 30, include_past: true } },
  "Garantía (meses)": { validation: { integer_only: true, min: 0 } },
};

const toPlan = (f: FieldPreset): PlanPreset => ({ ...f, rules: SUGGESTED_RULES[f.label] });

/**
 * Product types (categories) and product columns (custom fields) suggested for the rubro.
 * Only what is ticked and still missing gets created; what already exists is shown as done.
 */
export function SetupStep({ companyId, business, categories, fields, onSaved, onBack, onNext }: SetupStepProps) {
  const presetFields = business?.fields ?? GENERIC_FIELDS;
  const hasCategory = (name: string) => categories.some((c) => norm(c.name) === norm(name));
  const plan = useColumnPlan(fields, presetFields.map(toPlan));

  const [extra, setExtra] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [pickedCats, setPickedCats] = useState<Set<string>>(() => new Set(business?.categories ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCats = [...(business?.categories ?? []), ...extra];
  const toggle = (set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const addCategory = () => {
    const name = typed.trim();
    if (!name) return;
    if (!allCats.some((c) => norm(c) === norm(name))) setExtra((e) => [...e, name]);
    setPickedCats((s) => new Set(s).add(name));
    setTyped("");
  };

  const newCats = allCats.filter((c) => pickedCats.has(c) && !hasCategory(c));
  const pending = newCats.length + plan.pending;

  const apply = async () => {
    if (!companyId || pending === 0) return onNext();
    setSaving(true);
    setError(null);
    try {
      for (const name of newCats) await categoriesApi.create(companyId, { name });
      await plan.apply(companyId);
      onSaved();
      onNext();
    } catch (err) {
      onSaved();
      setError(err instanceof Error ? err.message : "No se pudo guardar todo. Revisa y vuelve a intentar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker={business ? `Paso 3 · Ajustes para «${business.label}»` : "Paso 3 · Ajustes"}
        title="Así ordenamos tus productos"
        text="Marca lo que te sirve. Los tipos de producto ordenan tu inventario y la caja; las columnas son datos extra de cada producto. Todo se edita luego en Inventario."
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

      <section aria-labelledby="setup-cats" className="flex flex-col gap-3">
        <h2 id="setup-cats" className="text-[15px] font-semibold text-text-primary">Tipos de producto</h2>
        <div className="flex flex-wrap gap-2">
          {allCats.map((name) =>
            hasCategory(name) ? (
              <span key={name} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-success-soft px-3.5 text-[13px] font-semibold text-success">
                <Check aria-hidden className="h-3.5 w-3.5" /> {name}
              </span>
            ) : (
              <Chip key={name} active={pickedCats.has(name)} onClick={() => setPickedCats((s) => toggle(s, name))}>
                {pickedCats.has(name) && <Check aria-hidden className="h-3.5 w-3.5" />} {name}
              </Chip>
            ),
          )}
        </div>
        <form
          className="flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCategory();
          }}
        >
          <label htmlFor="setup-new-cat" className="sr-only">Otro tipo de producto</label>
          <input
            id="setup-new-cat"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Agrega otro, ej. Ofertas"
            className={inputClass(false, "h-10")}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-10" disabled={!typed.trim()}>
            <Plus aria-hidden className="h-4 w-4" /> Agregar
          </Button>
        </form>
      </section>

      <section aria-labelledby="setup-fields" className="flex flex-col gap-3">
        <div>
          <h2 id="setup-fields" className="text-[15px] font-semibold text-text-primary">Columnas de cada producto</h2>
          <p className="text-[13px] text-text-muted">Marca las sugeridas o crea las tuyas. Con el lápiz eliges qué se puede guardar y cuándo avisarte.</p>
        </div>
        <ColumnPlanner plan={plan} />
      </section>

      <StepActions
        onBack={onBack}
        onNext={() => void apply()}
        onSkip={pending > 0 ? onNext : undefined}
        nextLabel={pending > 0 ? `Crear ${pending} ${pending === 1 ? "ajuste" : "ajustes"} y continuar` : "Continuar"}
        loading={saving}
      />
    </div>
  );
}
