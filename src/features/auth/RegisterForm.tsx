"use client";

import { useState } from "react";
import { Building2, Hash, Mail, User } from "lucide-react";
import { register } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/utils";
import { PasswordField } from "./PasswordField";
import { emailError, newPasswordError, passwordStrength, rucError } from "./validation";

interface RegisterFormProps {
  onRegistered: () => void;
  onSignIn: () => void;
}

const STRENGTH = [
  { label: "", className: "" },
  { label: "Débil", className: "bg-danger" },
  { label: "Aceptable", className: "bg-warning" },
  { label: "Fuerte", className: "bg-success" },
];

/** Creates the company and its owner account; the API answers with a session right away. */
export function RegisterForm({ onRegistered, onSignIn }: RegisterFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [ruc, setRuc] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const problems = {
    companyName: companyName.trim() ? null : "Escribe el nombre de tu negocio.",
    ruc: rucError(ruc),
    fullName: fullName.trim() ? null : "Escribe tu nombre.",
    email: emailError(email),
    password: newPasswordError(password),
  };
  const show = (key: keyof typeof problems) => (touched ? problems[key] : null);
  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.values(problems).some(Boolean)) return;
    setLoading(true);
    try {
      await register({
        company_name: companyName.trim(),
        tax_id: ruc,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la cuenta. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[32px] font-bold leading-tight tracking-[-0.03em]">Crea tu cuenta</h2>
        <p className="text-[15px] text-text-secondary">Tu negocio y tu usuario. Toma un minuto.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">Tu negocio</legend>
        <TextField
          label="Nombre comercial"
          autoComplete="organization"
          autoFocus
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          error={show("companyName")}
          placeholder="Bodega Santa Rosa"
          prefix={<Building2 aria-hidden className="h-[18px] w-[18px]" />}
        />
        <TextField
          label="RUC"
          inputMode="numeric"
          value={ruc}
          onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
          error={show("ruc")}
          hint="11 dígitos. Sale en tus comprobantes."
          placeholder="20601234567"
          className="[&_input]:font-mono"
          prefix={<Hash aria-hidden className="h-[18px] w-[18px]" />}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">Tú</legend>
        <TextField
          label="Tu nombre"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={show("fullName")}
          prefix={<User aria-hidden className="h-[18px] w-[18px]" />}
        />
        <TextField
          label="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={show("email")}
          placeholder="tu@correo.pe"
          prefix={<Mail aria-hidden className="h-[18px] w-[18px]" />}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            error={show("password")}
            hint="Mínimo 8 caracteres, con letras y números."
          />
          {password && (
            <div className="flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1.5" aria-hidden>
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={cn("h-1.5 flex-1 rounded-full bg-surface-muted transition-colors", strength >= step && STRENGTH[strength].className)}
                  />
                ))}
              </div>
              <span className="w-20 text-right text-[12px] font-semibold text-text-secondary">{STRENGTH[strength].label}</span>
            </div>
          )}
        </div>
      </fieldset>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onSignIn} className="font-semibold text-accent-text hover:underline">
          Entra aquí
        </button>
      </p>
    </form>
  );
}
