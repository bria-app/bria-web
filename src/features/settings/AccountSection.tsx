"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { useApi } from "@/hooks/useApi";
import { loadCurrentUser } from "@/hooks/useProfile";
import { logout } from "@/services/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Fact, SettingsBlock } from "./SettingsBlock";
import { roleInfo } from "./roles";

/** Configuración › Tu cuenta: who is signed in, their password and the way out. */
export function AccountSection() {
  const router = useRouter();
  const me = useApi(loadCurrentUser, []);

  const signOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <DataState loading={me.loading && !me.data} error={me.error} onRetry={me.reload}>
      {me.data && (
        <div className="flex flex-col gap-6">
          <SettingsBlock title="Tu cuenta" hint="Con estos datos entras a bria.">
            <div className="grid gap-5 sm:grid-cols-3">
              <Fact label="Nombre">{me.data.full_name}</Fact>
              <Fact label={me.data.username ? "Usuario" : "Correo"} mono={!!me.data.username}>
                {me.data.username ?? me.data.email ?? "Sin dato"}
              </Fact>
              <Fact label="Rol"><Badge tone={roleInfo(me.data.role).tone}>{roleInfo(me.data.role).label}</Badge></Fact>
            </div>
            <p className="text-[13px] text-text-muted">Tu nombre y tu correo no se pueden cambiar desde aquí todavía.</p>
          </SettingsBlock>

          <SettingsBlock title="Contraseña" hint="Cámbiala si crees que alguien más la conoce.">
            <ChangePasswordForm />
          </SettingsBlock>

          <SettingsBlock title="Cerrar sesión" hint="Sales de bria en este navegador. Tus datos quedan guardados.">
            <div>
              <Button variant="secondary" onClick={signOut}><LogOut aria-hidden className="h-4 w-4" /> Cerrar sesión</Button>
            </div>
          </SettingsBlock>
        </div>
      )}
    </DataState>
  );
}
