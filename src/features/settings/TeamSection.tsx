"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { useToast } from "@/components/ui/Toast";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useProfile } from "@/hooks/useProfile";
import { usersApi } from "@/services/api/users";
import type { UserDTO } from "@/types/api";
import { CreateUserModal } from "./CreateUserModal";
import { MemberSheet } from "./MemberSheet";
import { RolesGuide } from "./RolesGuide";
import { SetPasswordModal } from "./SetPasswordModal";
import { SettingsBlock } from "./SettingsBlock";
import { TeamSales } from "./TeamSales";
import { UserRow } from "./UserRow";
import { roleInfo, type AssignableRole } from "./roles";

/** Configuración › Equipo y permisos: users of the company and what each role can do. */
export function TeamSection({ canEdit }: { canEdit: boolean }) {
  const companyId = useCompanyId();
  const toast = useToast();
  const { user: me } = useProfile();
  const users = useApi(() => (companyId ? usersApi.list(companyId) : Promise.resolve(null)), [companyId]);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<UserDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = users.data ?? [];
  // Looked up by id, so the sheet shows the fresh name after a rename.
  const opened = list.find((u) => u.id === openId) ?? null;

  const run = async (u: UserDTO, action: () => Promise<unknown>, done: string, undo: () => Promise<unknown>) => {
    setBusyId(u.id);
    setError(null);
    try {
      await action();
      users.reload();
      toast(done, {
        undo: () => {
          undo()
            .then(() => users.reload())
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudo deshacer. Inténtalo de nuevo."));
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar a esta persona. Inténtalo de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u: UserDTO, role: AssignableRole) => {
    if (!companyId) return;
    const previous = u.role as AssignableRole;
    void run(u, () => usersApi.setRole(companyId, u.id, role), `${u.full_name} ahora es ${roleInfo(role).label.toLowerCase()}`, () =>
      usersApi.setRole(companyId, u.id, previous),
    );
  };

  const toggle = (u: UserDTO) => {
    if (!companyId) return;
    const next = u.status === "disabled" ? "active" : "disabled";
    const back = u.status === "disabled" ? "disabled" : "active";
    void run(
      u,
      () => usersApi.update(companyId, u.id, { status: next }),
      next === "disabled" ? `${u.full_name} ya no puede entrar` : `${u.full_name} puede volver a entrar`,
      () => usersApi.update(companyId, u.id, { status: back }),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsBlock
        title="Tu equipo"
        hint="Cada persona entra con su propio usuario. Los vendedores no necesitan correo."
        action={canEdit && <Button onClick={() => setCreateOpen(true)} disabled={!companyId}><UserPlus aria-hidden className="h-4 w-4" /> Nuevo usuario</Button>}
      >
        {!canEdit && (
          <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">Solo el dueño o un administrador puede cambiar el equipo.</p>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
        <DataState loading={users.loading && !users.data} error={users.error} onRetry={users.reload}>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {list.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isMe={u.id === me?.id}
                editable={canEdit && u.role !== "owner" && u.id !== me?.id}
                busy={busyId === u.id}
                onRole={(role) => changeRole(u, role)}
                onPassword={() => setPasswordFor(u)}
                onToggle={() => toggle(u)}
                onOpen={canEdit ? () => setOpenId(u.id) : undefined}
              />
            ))}
          </ul>
          {list.length > 0 && !list.some((u) => u.role === "seller") && (
            <p className="text-sm text-text-secondary">Aún no tienes vendedores. Crea uno para que cobre en la caja con su propio usuario.</p>
          )}
          <p className="text-[13px] text-text-muted">
            Desactivar es la forma de quitar a alguien: ya no puede entrar y sus ventas se conservan. Puedes volver a activarlo.
          </p>
        </DataState>
      </SettingsBlock>

      {canEdit && companyId && (
        <TeamSales companyId={companyId} canOpen={(id) => list.some((u) => u.id === id)} onOpen={setOpenId} />
      )}

      <RolesGuide extraRoles={list.map((u) => u.role)} />

      {companyId && (
        <>
          <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} companyId={companyId} onCreated={users.reload} />
          <SetPasswordModal user={passwordFor} companyId={companyId} onClose={() => setPasswordFor(null)} />
          <MemberSheet
            user={opened}
            companyId={companyId}
            canRename={canEdit && (opened?.role !== "owner" || opened.id === me?.id)}
            onClose={() => setOpenId(null)}
            onChanged={users.reload}
          />
        </>
      )}
    </div>
  );
}
