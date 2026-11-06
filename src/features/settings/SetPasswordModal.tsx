"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { usersApi } from "@/services/api/users";
import { generatePassword } from "./credentials";
import type { UserDTO } from "@/types/api";
import { PasswordInput } from "./PasswordInput";
import { MIN_PASSWORD } from "./roles";

interface SetPasswordModalProps {
  user: UserDTO | null;
  companyId: string;
  onClose: () => void;
}

/** The owner sets a new password for a team member (PATCH /users/{id} with `password`). */
export function SetPasswordModal({ user, companyId, onClose }: SetPasswordModalProps) {
  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      title="Poner otra contraseña"
      description={user ? `Para ${user.full_name}. La anterior deja de funcionar al guardar.` : undefined}
      size="sm"
    >
      {user && <SetPasswordBody user={user} companyId={companyId} onClose={onClose} />}
    </Modal>
  );
}

function SetPasswordBody({ user, companyId, onClose }: { user: UserDTO; companyId: string; onClose: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState(generatePassword);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const tooShort = password.length < MIN_PASSWORD;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tooShort) return;
    setSaving(true);
    setApiError(null);
    try {
      await usersApi.update(companyId, user.id, { password });
      toast(`Nueva contraseña lista para ${user.full_name}. Compártela con esa persona.`);
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Entra con el usuario <span className="font-mono font-semibold text-text-primary">{user.username ?? user.email}</span>. Copia la contraseña antes de guardar: después no se vuelve a mostrar.
      </p>
      <PasswordInput
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        error={tooShort ? `Mínimo ${MIN_PASSWORD} caracteres (llevas ${password.length}).` : null}
      />
      {apiError && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{apiError}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="strong" loading={saving} disabled={tooShort}>Guardar contraseña</Button>
      </div>
    </form>
  );
}
