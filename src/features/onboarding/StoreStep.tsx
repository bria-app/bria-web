"use client";

import { useState } from "react";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { TextField } from "@/components/ui/TextField";
import { companiesApi } from "@/services/api/resources";
import { isEmail } from "@/features/auth/validation";
import type { CompanyDTO } from "@/types/api";
import { StepActions, StepHeading } from "./StepHeading";

export interface StoreDraft {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface StoreStepProps {
  companyId: string | null;
  company: CompanyDTO;
  /** Live values, so the preview beside the form follows what is typed. */
  onDraft: (draft: StoreDraft) => void;
  onSaved: () => void;
  onBack: () => void;
  onNext: () => void;
}

const digits = (v: string) => v.replace(/\D/g, "");

function problemsOf(d: StoreDraft) {
  const phone = digits(d.phone);
  return {
    name: d.name.trim().length < 2 ? "Escribe el nombre de tu tienda." : null,
    phone: d.phone.trim() && (phone.length < 6 || phone.length > 12) ? `El teléfono tiene de 6 a 12 dígitos (llevas ${phone.length}).` : null,
    // The company always keeps an email (the API rejects an empty one), so it can be changed but not cleared.
    email: !d.email.trim() ? "Escribe el correo de la tienda." : !isEmail(d.email) ? "Revisa el correo: debe verse como nombre@correo.pe." : null,
  };
}

/** The shop's public details: they head every boleta and factura. */
export function StoreStep({ companyId, company, onDraft, onSaved, onBack, onNext }: StoreStepProps) {
  const [draft, setDraft] = useState<StoreDraft>({ name: company.name, address: company.address, phone: company.phone, email: company.email });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problems = problemsOf(draft);
  const shown = (k: keyof typeof problems) => (submitted ? problems[k] : null);

  const set = (key: keyof StoreDraft) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...draft, [key]: e.target.value };
    setDraft(next);
    onDraft(next);
  };

  const changed =
    draft.name.trim() !== company.name || draft.address.trim() !== company.address || draft.phone.trim() !== company.phone || draft.email.trim() !== company.email;

  const save = async () => {
    setSubmitted(true);
    setError(null);
    if (Object.values(problems).some(Boolean)) return;
    if (!changed || !companyId) return onNext();
    setSaving(true);
    try {
      await companiesApi.update(companyId, {
        name: draft.name.trim(),
        address: draft.address.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
      });
      onSaved();
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <StepHeading
        kicker="Paso 2 · Tu tienda"
        title="Así te verán tus clientes"
        text="Estos datos salen en cada boleta y factura."
      />
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nombre comercial"
          value={draft.name}
          onChange={set("name")}
          error={shown("name")}
          autoComplete="organization"
          className="sm:col-span-2"
          prefix={<Building2 aria-hidden className="h-[18px] w-[18px]" />}
        />
        <TextField
          label="Dirección"
          value={draft.address}
          onChange={set("address")}
          hint="Opcional. Calle, número y distrito."
          placeholder="Av. Grau 245, Barranco"
          autoComplete="street-address"
          className="sm:col-span-2"
          prefix={<MapPin aria-hidden className="h-[18px] w-[18px]" />}
        />
        <TextField
          label="Teléfono o WhatsApp"
          value={draft.phone}
          onChange={set("phone")}
          error={shown("phone")}
          hint="Opcional."
          inputMode="tel"
          autoComplete="tel"
          placeholder="987 654 321"
          className="[&_input]:font-mono"
          prefix={<Phone aria-hidden className="h-[18px] w-[18px]" />}
        />
        <TextField
          label="Correo de la tienda"
          type="email"
          value={draft.email}
          onChange={set("email")}
          error={shown("email")}
          inputMode="email"
          autoComplete="email"
          placeholder="ventas@tutienda.pe"
          prefix={<Mail aria-hidden className="h-[18px] w-[18px]" />}
        />
      </div>
      <p className="-mt-4 text-[13px] text-text-muted">
        El RUC <span className="font-mono text-text-secondary">{company.tax_id}</span> quedó registrado al crear tu cuenta.
      </p>

      <StepActions onBack={onBack} onNext={() => void save()} nextLabel={changed ? "Guardar y continuar" : "Continuar"} loading={saving} />
    </form>
  );
}
