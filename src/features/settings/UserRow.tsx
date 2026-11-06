"use client";

import { KeyRound, Power } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { initialsOf } from "@/hooks/useProfile";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserDTO } from "@/types/api";
import { CREATABLE_ROLES, roleInfo, type AssignableRole } from "./roles";

interface UserRowProps {
  user: UserDTO;
  isMe: boolean;
  /** Owner/admin looking at someone else who is not the owner. */
  editable: boolean;
  busy: boolean;
  onRole: (role: AssignableRole) => void;
  onPassword: () => void;
  onToggle: () => void;
  /** Opens the person's sheet (owner/admin only). */
  onOpen?: () => void;
}

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Activo", tone: "success" },
  invited: { label: "Invitado", tone: "warning" },
  disabled: { label: "Desactivado", tone: "danger" },
};

/** One person: who, how they sign in, state; role and actions wrap below on narrow widths. */
export function UserRow({ user, isMe, editable, busy, onRole, onPassword, onToggle, onOpen }: UserRowProps) {
  const role = roleInfo(user.role);
  const status = STATUS[user.status] ?? { label: user.status, tone: "warning" as const };
  const disabled = user.status === "disabled";
  const roleOptions = CREATABLE_ROLES.map((r) => ({ value: r.value as AssignableRole, label: r.label }));
  if (!roleOptions.some((o) => o.value === user.role)) {
    roleOptions.push({ value: user.role as AssignableRole, label: role.label });
  }

  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 first:rounded-t-2xl last:rounded-b-2xl sm:px-5", disabled && "bg-surface-soft")}>
      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold",
            isMe ? "bg-strong text-strong-foreground" : "bg-surface-muted text-text-secondary",
          )}
        >
          {initialsOf(user.full_name)}
        </span>
        <div className="min-w-0">
          <p className={cn("truncate text-[14px] font-semibold", disabled ? "text-text-muted" : "text-text-primary")}>
            {onOpen ? (
              <button type="button" onClick={onOpen} className="truncate text-left hover:underline" title="Ver su ficha">
                {user.full_name}
              </button>
            ) : (
              user.full_name
            )}
            {isMe && <span className="ml-1.5 text-xs font-medium text-text-muted">(tú)</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-text-muted">
            <span className="truncate font-mono">{user.username ?? user.email ?? "Sin usuario"}</span>
            <span aria-hidden>·</span>
            <span>{user.last_login_at ? `Entró ${timeAgo(user.last_login_at)}` : "Nunca entró"}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {status.tone !== "success" && <Badge tone={status.tone}>{status.label}</Badge>}
        {editable ? (
          <div className="w-40">
            <Select<AssignableRole>
              aria-label={`Rol de ${user.full_name}`}
              value={user.role as AssignableRole}
              options={roleOptions}
              onChange={(v) => v !== user.role && onRole(v)}
              disabled={busy || disabled}
              className="py-2"
            />
          </div>
        ) : (
          <Badge tone={role.tone}>{role.label}</Badge>
        )}
        {editable && (
          <>
            <button
              type="button"
              onClick={onPassword}
              disabled={busy}
              aria-label={`Cambiar la contraseña de ${user.full_name}`}
              title="Cambiar contraseña"
              className="btn btn-ghost h-10 w-10 p-0"
            >
              <KeyRound aria-hidden className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              disabled={busy}
              className={cn("btn h-10 gap-1.5 px-3 text-[13px]", disabled ? "btn-secondary" : "btn-ghost text-danger")}
            >
              <Power aria-hidden className="h-3.5 w-3.5" /> {disabled ? "Activar" : "Desactivar"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
