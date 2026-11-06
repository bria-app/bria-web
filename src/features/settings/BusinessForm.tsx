"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { BUSINESS_TYPES } from "@/features/onboarding/businesses";
import { companiesApi } from "@/services/api/resources";
import type { CompanyDTO } from "@/types/api";
import { Fact, SettingsBlock } from "./SettingsBlock";
import { rucProblem } from "./ruc";

type Fields = Pick<CompanyDTO, "name" | "business_type" | "address" | "phone" | "email">;
type Key = keyof Fields;

const KEYS: Key[] = ["name", "business_type", "address", "phone", "email"];
const pick = (c: Fields): Fields => ({ name: c.name, business_type: c.business_type, address: c.address, phone: c.phone, email: c.email });

function validate(f: Fields): Partial<Record<Key, string>> {
  const errors: Partial<Record<Key, string>> = {};
  if (!f.name.trim()) errors.name = "Escribe el nombre de tu negocio.";
  // The backend stores the company email as a required, validated address: it cannot be blank.
  if (!f.email.trim()) errors.email = "Escribe el correo del negocio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errors.email = "Revisa el correo: le falta la @ o el dominio.";
  if (f.phone.trim() && !/^\+?[\d\s-]{6,20}$/.test(f.phone.trim())) errors.phone = "Usa solo números, espacios o guiones (mínimo 6).";
  return errors;
}

export function BusinessForm({ company, canEdit }: { company: CompanyDTO; canEdit: boolean }) {
  const toast = useToast();
  const [saved, setSaved] = useState<Fields>(() => pick(company));
  const [form, setForm] = useState<Fields>(() => pick(company));
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const errors = validate(form);
  const shown = (k: Key) => ((submitted || touched[k]) && errors[k]) || null;
  const changed = KEYS.filter((k) => form[k].trim() !== saved[k].trim());
  const ruc = rucProblem(company.tax_id);

  const typeOptions = useMemo(() => {
    const options = BUSINESS_TYPES.map((b) => ({ value: b.label, label: b.label, description: b.tagline }));
    if (saved.business_type && !options.some((o) => o.value === saved.business_type)) {
      options.unshift({ value: saved.business_type, label: saved.business_type, description: "Tu rubro actual" });
    }
    return options;
  }, [saved.business_type]);

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));

  const patch = async (values: Fields, keys: Key[]) => {
    const body = Object.fromEntries(keys.map((k) => [k, values[k].trim()])) as Partial<Fields>;
    return pick(await companiesApi.update(company.id, body));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    if (Object.keys(errors).length || changed.length === 0) return;
    const previous = saved;
    const keys = changed;
    setSaving(true);
    try {
      const next = await patch(form, keys);
      setSaved(next);
      setForm(next);
      setSubmitted(false);
      setTouched({});
      toast("Guardaste los datos del negocio", {
        undo: () => {
          patch(previous, keys)
            .then((back) => {
              setSaved(back);
              setForm(back);
            })
            .catch((err: unknown) => setApiError(err instanceof Error ? err.message : "No se pudo deshacer. Inténtalo de nuevo."));
        },
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <SettingsBlock title="Tu negocio" hint="Cómo se llama y cómo te contactan. Lo ve todo tu equipo.">
        {!canEdit && (
          <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">
            Solo el dueño o un administrador puede cambiar estos datos.
          </p>
        )}
        {/* By the room the card has: one field per line in a narrow column, two where they fit. */}
        <div className="@container">
        <div className="grid gap-4 @md:grid-cols-2">
          <TextField label="Nombre del negocio" value={form.name} onChange={set("name")} onBlur={blur("name")} error={shown("name")} disabled={!canEdit} maxLength={160} />
          <div className="flex flex-col gap-1.5">
            <span aria-hidden className="text-[13px] font-semibold text-text-secondary">Rubro</span>
            <Select
              aria-label="Rubro"
              value={form.business_type}
              onChange={(v) => setForm((f) => ({ ...f, business_type: v }))}
              options={typeOptions}
              placeholder="Elige tu rubro"
              disabled={!canEdit}
              className="h-12"
            />
          </div>
          <TextField label="Teléfono" hint="Opcional" inputMode="tel" value={form.phone} onChange={set("phone")} onBlur={blur("phone")} error={shown("phone")} disabled={!canEdit} />
          <TextField label="Correo del negocio" type="email" value={form.email} onChange={set("email")} onBlur={blur("email")} error={shown("email")} disabled={!canEdit} />
          <TextField label="Dirección" hint="Opcional" value={form.address} onChange={set("address")} disabled={!canEdit} className="@md:col-span-2" />
        </div>
        </div>
        {apiError && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{apiError}</p>}
        {canEdit && (
          <div className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
            <span className="text-[13px] text-text-muted">
              {changed.length === 0 ? "Sin cambios por guardar" : changed.length === 1 ? "1 cambio sin guardar" : `${changed.length} cambios sin guardar`}
            </span>
            <Button type="submit" loading={saving} disabled={changed.length === 0}>Guardar cambios</Button>
          </div>
        )}
      </SettingsBlock>

      <SettingsBlock title="RUC" hint="Es el RUC con el que creaste la cuenta. No se puede cambiar desde aquí.">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <Fact label="Número" mono>{company.tax_id || "Sin RUC"}</Fact>
          {company.tax_id && (
            <p className={ruc ? "text-sm text-warning" : "text-sm text-success"}>
              {ruc ? `Revisa este RUC: ${ruc}` : "RUC válido."}
            </p>
          )}
        </div>
      </SettingsBlock>
    </form>
  );
}
