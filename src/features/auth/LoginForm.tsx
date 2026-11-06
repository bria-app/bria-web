"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { login } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PasswordField } from "./PasswordField";

interface LoginFormProps {
  /** Called once the tokens are stored; the page decides where to go next. */
  onSignedIn: () => void;
  onCreateAccount: () => void;
}

export function LoginForm({ onSignedIn, onCreateAccount }: LoginFormProps) {
  // Owners sign in with their email; sellers have no email and use the username their owner gave them.
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const identifierProblem = touched && !identifier.trim() ? "Escribe tu correo o tu usuario." : null;
  const passwordProblem = touched && !password ? "Escribe tu contraseña." : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!identifier.trim() || !password) return;
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-display text-[32px] font-bold leading-tight tracking-[-0.03em]">Hola de nuevo</h2>
        <p className="text-[15px] text-text-secondary">Entra con tu correo o tu usuario.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <TextField
          label="Correo o usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={identifierProblem}
          hint="Si eres vendedor, usa el usuario que te dieron."
          placeholder="tu@correo.pe"
          prefix={<Mail aria-hidden className="h-[18px] w-[18px]" />}
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={passwordProblem}
        />
        <button
          type="button"
          onClick={() => setShowRecovery((v) => !v)}
          aria-expanded={showRecovery}
          className="self-start text-[13px] font-semibold text-accent-text hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
        {showRecovery && (
          <div className="rounded-xl bg-surface-soft px-4 py-3 text-[13px] leading-relaxed text-text-secondary">
            Si trabajas en una tienda, pídele a quien administra la cuenta que te asigne una contraseña nueva desde{" "}
            <strong className="text-text-primary">Configuración → Equipo y permisos</strong>. La recuperación por correo todavía no está
            disponible.
          </div>
        )}
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Entrar
      </Button>

      <p className="text-center text-sm text-text-secondary">
        ¿Tu negocio aún no usa bria?{" "}
        <button type="button" onClick={onCreateAccount} className="font-semibold text-accent-text hover:underline">
          Crea una cuenta
        </button>
      </p>
    </form>
  );
}
