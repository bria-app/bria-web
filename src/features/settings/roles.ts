import type { BadgeTone } from "@/components/ui/Badge";
import type { UserRole } from "@/types/api";

/** Roles an owner or admin can give from the team screen (the backend accepts these two for new users). */
export type AssignableRole = Exclude<UserRole, "owner">;

export const CREATABLE_ROLES: { value: "seller" | "admin"; label: string }[] = [
  { value: "seller", label: "Vendedor" },
  { value: "admin", label: "Administrador" },
];

interface RoleInfo {
  label: string;
  tone: BadgeTone;
  /** What this role can do, in plain words. Mirrors the fixed rules in the backend. */
  summary: string;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  owner: {
    label: "Dueño",
    tone: "accent",
    summary: "Ve y cambia todo: ventas, compras, costos, equipo y plan. Nadie puede desactivarlo.",
  },
  admin: {
    label: "Administrador",
    tone: "info",
    summary: "Igual que el dueño: puede anular ventas, cambiar el equipo, los datos del negocio y el plan.",
  },
  seller: {
    label: "Vendedor",
    tone: "neutral",
    summary:
      "Cobra en la caja, ve solo sus propias ventas y consulta inventario y precios. No entra a compras, proveedores, pronóstico, reportes ni configuración, y no puede anular ventas.",
  },
  analyst: {
    label: "Analista",
    tone: "neutral",
    summary: "Ve y cambia casi todo, menos el equipo, los datos del negocio, el plan y las anulaciones.",
  },
  viewer: {
    label: "Lector",
    tone: "neutral",
    summary: "Ve todo lo del negocio, pero no cambia nada. Solo puede marcar sus avisos como leídos.",
  },
};

export function roleInfo(role: string): RoleInfo {
  return ROLE_INFO[role as UserRole] ?? { label: role, tone: "neutral", summary: "" };
}

export const USERNAME_RE = /^[a-z0-9._-]{3,60}$/;
export const MIN_PASSWORD = 8;
