"use client";

import { useState } from "react";
import { ScanBarcode, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { initialsOf } from "@/hooks/useProfile";
import { CreateUserModal } from "@/features/settings/CreateUserModal";
import { roleInfo } from "@/features/settings/roles";
import type { UserDTO } from "@/types/api";
import { StepActions, StepHeading } from "./StepHeading";

interface TeamStepProps {
  companyId: string | null;
  /** Everyone except the person setting up the account. */
  team: UserDTO[];
  onSaved: () => void;
  onBack: () => void;
  onNext: () => void;
}

/** Optional: accounts for the people who charge at the till (username + password, no email). */
export function TeamStep({ companyId, team, onSaved, onBack, onNext }: TeamStepProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker="Paso 6 · Equipo"
        title="¿Alguien más atiende tu tienda?"
        text="Crea un usuario para cada persona que cobra. Entran con usuario y contraseña, sin correo, y solo ven la caja, sus ventas y el inventario: nunca tus costos ni tus ganancias."
      />

      <div className="flex items-start gap-3 rounded-2xl bg-surface-soft p-4 text-[13.5px] text-text-secondary">
        <ScanBarcode aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
        <p>
          Cada venta queda con el nombre de quien la cobró, así sabes cuánto vendió cada uno. Si trabajas solo, salta este paso: lo
          puedes hacer cuando contrates a alguien, desde Configuración.
        </p>
      </div>

      {team.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {team.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted text-[13px] font-bold text-text-secondary">
                {initialsOf(u.full_name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-text-primary">{u.full_name}</span>
                <span className="block truncate font-mono text-[12.5px] text-text-muted">{u.username ?? u.email}</span>
              </span>
              <Badge tone="neutral">{roleInfo(u.role).label}</Badge>
            </li>
          ))}
        </ul>
      )}

      {companyId && (
        <Button variant={team.length ? "secondary" : "primary"} onClick={() => setOpen(true)} className="w-fit">
          <UserPlus aria-hidden className="h-4 w-4" /> {team.length ? "Agregar a otra persona" : "Agregar a alguien"}
        </Button>
      )}

      <StepActions onBack={onBack} onNext={onNext} nextLabel={team.length ? "Continuar" : "Trabajo solo, continuar"} quiet={!team.length} />

      {companyId && <CreateUserModal open={open} onClose={() => setOpen(false)} companyId={companyId} onCreated={onSaved} />}
    </div>
  );
}
