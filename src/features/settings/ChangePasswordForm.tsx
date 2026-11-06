"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { changeOwnPassword } from "@/services/api/users";
import { MIN_PASSWORD } from "./roles";

const EMPTY = { current: "", next: "", repeat: "" };

/** PATCH /auth/me/password, with the checks the backend leaves to the client. */
export function ChangePasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const errors = {
    current: form.current ? null : "Escribe tu contraseña actual.",
    next:
      form.next.length < MIN_PASSWORD
        ? `Usa al menos ${MIN_PASSWORD} caracteres (llevas ${form.next.length}).`
        : form.next === form.current
          ? "La nueva tiene que ser distinta de la actual."
          : null,
    repeat: form.repeat === form.next ? null : "No coincide con la nueva contraseña.",
  };
  const shown = (k: keyof typeof errors) => (submitted ? errors[k] : null);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    if (errors.current || errors.next || errors.repeat) return;
    setSaving(true);
    try {
      await changeOwnPassword({ current_password: form.current, new_password: form.next });
      setForm(EMPTY);
      setSubmitted(false);
      toast("Cambiaste tu contraseña. Úsala la próxima vez que entres.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Contraseña actual" type="password" autoComplete="current-password" value={form.current} onChange={set("current")} error={shown("current")} />
        <TextField label="Nueva contraseña" type="password" autoComplete="new-password" value={form.next} onChange={set("next")} error={shown("next")} hint={`Mínimo ${MIN_PASSWORD} caracteres`} />
        <TextField label="Repite la nueva" type="password" autoComplete="new-password" value={form.repeat} onChange={set("repeat")} error={shown("repeat")} />
      </div>
      {apiError && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{apiError}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="strong" loading={saving}>Cambiar contraseña</Button>
      </div>
    </form>
  );
}
