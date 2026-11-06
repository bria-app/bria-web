import { Badge } from "@/components/ui/Badge";
import type { UserRole } from "@/types/api";
import { SettingsBlock } from "./SettingsBlock";
import { ROLE_INFO } from "./roles";

/**
 * What each role can do. Permissions are fixed per role in the backend, so this explains
 * them instead of offering switches that would not change anything.
 */
export function RolesGuide({ extraRoles }: { extraRoles: UserRole[] }) {
  const roles: UserRole[] = ["owner", "admin", "seller", ...new Set(extraRoles.filter((r) => r === "analyst" || r === "viewer"))];
  return (
    <SettingsBlock title="Qué puede hacer cada rol" hint="Los permisos van con el rol y son iguales para todos los que lo tienen. Para dar más o menos acceso, cambia el rol.">
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
        {roles.map((r) => (
          <li key={r} className="flex flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4">
            <span className="w-32 shrink-0"><Badge tone={ROLE_INFO[r].tone}>{ROLE_INFO[r].label}</Badge></span>
            <span className="text-sm leading-relaxed text-text-secondary">{ROLE_INFO[r].summary}</span>
          </li>
        ))}
      </ul>
    </SettingsBlock>
  );
}
