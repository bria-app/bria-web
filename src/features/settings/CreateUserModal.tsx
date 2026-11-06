"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { usersApi } from "@/services/api/users";
import { generatePassword, suggestUsername } from "./credentials";
import { PasswordInput } from "./PasswordInput";
import { CREATABLE_ROLES, MIN_PASSWORD, USERNAME_RE, roleInfo } from "./roles";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onCreated: () => void;
}

/** New team member that signs in with a username (POST /companies/{id}/users). */
export function CreateUserModal({ open, onClose, companyId, onCreated }: CreateUserModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Nuevo usuario" description="Entra con un usuario y una contraseña, sin correo." size="sm">
      <CreateUserBody companyId={companyId} onClose={onClose} onCreated={onCreated} />
    </Modal>
  );
}

function CreateUserBody({ companyId, onClose, onCreated }: Omit<CreateUserModalProps, "open">) {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [typedUsername, setTypedUsername] = useState<string | null>(null);
  const [role, setRole] = useState<"seller" | "admin">("seller");
  const [password, setPassword] = useState(generatePassword);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; username: string; password: string } | null>(null);

  const username = typedUsername ?? suggestUsername(fullName);
  const errors = {
    name: fullName.trim().length < 2 ? "Escribe su nombre y apellido." : null,
    username: !USERNAME_RE.test(username) ? "De 3 a 60 caracteres: minúsculas, números, punto, guion o guion bajo." : null,
    password: password.length < MIN_PASSWORD ? `La contraseña tiene ${MIN_PASSWORD} caracteres como mínimo (llevas ${password.length}).` : null,
  };
  const shown = (k: keyof typeof errors) => ((submitted || touched[k]) && errors[k]) || null;
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    if (errors.name || errors.username || errors.password) return;
    setSaving(true);
    try {
      await usersApi.create(companyId, { full_name: fullName.trim(), username, password, role });
      setCreated({ name: fullName.trim(), username, password });
      onCreated();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    const copyAll = () =>
      navigator.clipboard
        .writeText(`Usuario: ${created.username}\nContraseña: ${created.password}`)
        .then(() => toast("Datos de acceso copiados"))
        .catch(() => toast("Tu navegador no dejó copiar. Anótalos a mano."));
    return (
      <div className="flex flex-col gap-5">
        <p className="text-sm text-text-secondary">
          Entrégale estos datos a <strong className="text-text-primary">{created.name}</strong>. La contraseña no se vuelve a mostrar, pero puedes poner otra cuando quieras.
        </p>
        <dl className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-text-muted">Usuario</dt><dd className="font-mono font-semibold">{created.username}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-text-muted">Contraseña</dt><dd className="font-mono font-semibold">{created.password}</dd></div>
        </dl>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={copyAll}><Copy aria-hidden className="h-4 w-4" /> Copiar datos</Button>
          <Button variant="strong" onClick={onClose} data-autofocus>Listo</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField label="Nombre y apellido" value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={blur("name")} error={shown("name")} placeholder="Ej. Lucía Ramos" autoFocus />
      <TextField
        label="Usuario"
        hint="Con esto entra. Lo sugerimos a partir del nombre."
        value={username}
        onChange={(e) => setTypedUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
        onBlur={blur("username")}
        error={shown("username")}
        className="[&_input]:font-mono"
        autoComplete="off"
      />
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-text-secondary">Rol</span>
        <Segmented label="Rol" value={role} options={CREATABLE_ROLES.map((r) => ({ value: r.value, label: r.label }))} onChange={setRole} />
        <p className="text-[12.5px] leading-snug text-text-muted">{roleInfo(role).summary}</p>
      </div>
      <PasswordInput label="Contraseña" value={password} onChange={setPassword} onBlur={blur("password")} error={shown("password")} />
      {apiError && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{apiError}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="strong" loading={saving}>Crear usuario</Button>
      </div>
    </form>
  );
}
