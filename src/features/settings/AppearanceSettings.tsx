"use client";

import { useState } from "react";
import { getModePref, getMotion, setModePref, setMotion, type ModePref, type Motion } from "@/lib/appearance";
import { useNavMode, type DockStyle, type NavMode } from "@/hooks/useNavMode";
import {
  useDockSide,
  usePageFlow,
  useSectionMotion,
  type DockSide,
  type PageFlow,
  type SectionMotion,
} from "@/hooks/useDevicePref";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/utils";
import { SettingsBlock } from "./SettingsBlock";

/** One setting: what it is on the left, the choice on the right; wraps under on narrow widths. */
function Row({ label, hint, off, children }: { label: string; hint?: string; off?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 py-3.5 transition-opacity", off && "opacity-50")}>
      <div className="min-w-[220px] flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint && <p className="text-[12.5px] leading-snug text-text-muted">{hint}</p>}
      </div>
      {/* A disabled fieldset disables every button inside, without a special Segmented variant. */}
      <fieldset disabled={off} className="shrink-0">
        {children}
      </fieldset>
    </div>
  );
}

/** One card per topic, so each lands whole in a column when the page runs sideways. */
function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <SettingsBlock title={title} hint={hint}>
      <div className="-my-3.5 divide-y divide-border">{children}</div>
    </SettingsBlock>
  );
}

/** Per-device appearance: color, navigation, motion and how pages and lists scroll, a card each. */
export function AppearanceSettings() {
  // App screens render only in the browser (the shell gates them), so stored prefs can seed state.
  const [mode, setMode] = useState<ModePref>(getModePref);
  const [motion, setMotionState] = useState<Motion>(getMotion);
  const { preferred, narrow, setMode: setNav, preferredDock, setDockStyle } = useNavMode();
  const [dockSide, setDockSide] = useDockSide();
  const [sectionMotion, setSectionMotion] = useSectionMotion();
  const [pageFlow, setPageFlow] = usePageFlow();
  // The dock rows stay in place (dimmed) when the menu isn't the dock, so nothing jumps around.
  const dockOn = preferred === "dock" || narrow;

  return (
    <div className="flex flex-col gap-6">
      <Group title="Color" hint="Todo lo de Apariencia se guarda en este dispositivo: cada computadora o tableta puede verse distinta.">
        <Row label="Tema" hint="El oscuro descansa la vista de noche.">
          <Segmented<ModePref>
            label="Tema"
            value={mode}
            options={[
              { value: "light", label: "Claro" },
              { value: "dark", label: "Oscuro" },
              { value: "system", label: "Como el sistema" },
            ]}
            onChange={(v) => {
              setMode(v);
              setModePref(v);
            }}
          />
        </Row>
      </Group>

      <Group title="Menú">
        <Row label="Cómo navegas" hint={narrow ? "En pantallas angostas siempre se usa el dock." : "El dock pone botones grandes abajo: ideal para el mostrador."}>
          <Segmented<NavMode>
            label="Cómo navegas"
            value={preferred}
            options={[
              { value: "lateral", label: "Barra lateral" },
              { value: "riel", label: "Solo íconos" },
              { value: "dock", label: "Dock" },
            ]}
            onChange={setNav}
          />
        </Row>
        <Row
          label="Tipo de dock"
          off={!dockOn}
          hint={
            !dockOn
              ? "Solo con el menú Dock."
              : narrow
                ? "En el celular se usa el simple: no caben todas las secciones a un tamaño cómodo."
                : preferredDock === "completo"
                  ? "Todas las secciones de la barra lateral, en el dock."
                  : "Hoy, Caja, Inventario y Pronóstico; lo demás en «Todo»."
          }
        >
          <Segmented<DockStyle>
            label="Tipo de dock"
            value={preferredDock}
            options={[
              { value: "simple", label: "Simple" },
              { value: "completo", label: "Completo" },
            ]}
            onChange={setDockStyle}
          />
        </Row>
        <Row
          label="Posición del dock"
          off={!dockOn}
          hint={!dockOn ? "Solo con el menú Dock." : narrow ? "En el celular el dock va siempre abajo." : "Abajo o como columna en el borde izquierdo."}
        >
          <Segmented<DockSide>
            label="Posición del dock"
            value={dockSide}
            options={[
              { value: "abajo", label: "Abajo" },
              { value: "izquierda", label: "A la izquierda" },
            ]}
            onChange={setDockSide}
          />
        </Row>
      </Group>

      <Group title="Movimiento">
        <Row
          label="Cambio de sección"
          hint={sectionMotion === "deslizar" ? "Como diapositivas: también pasas de sección deslizando de lado." : "Cada pantalla se arma subiendo en su lugar."}
        >
          <Segmented<SectionMotion>
            label="Cambio de sección"
            value={sectionMotion}
            options={[
              { value: "subir", label: "Subir" },
              { value: "deslizar", label: "Deslizar de lado" },
            ]}
            onChange={setSectionMotion}
          />
        </Row>
        <Row label="Animaciones" hint={motion === "reduced" ? "Todo aparece sin moverse, también en el inicio de sesión." : "Transiciones y detalles en movimiento."}>
          <Segmented<Motion>
            label="Animaciones"
            value={motion}
            options={[
              { value: "full", label: "Completas" },
              { value: "reduced", label: "Reducidas" },
            ]}
            onChange={(v) => {
              setMotionState(v);
              setMotion(v);
            }}
          />
        </Row>
      </Group>

      <Group title="Desplazamiento">
        <Row
          label="Dirección"
          hint={
            (pageFlow === "lado" ? "Todo sigue hacia la derecha en columnas; la rueda o las flechas lo deslizan de corrido." : "Todo se baja de arriba hacia abajo, como siempre.") +
            " Vale para todas las pantallas. Si una lista se ve en tabla o en tarjetas se elige en cada lista."
          }
        >
          <Segmented<PageFlow>
            label="Dirección"
            value={pageFlow}
            options={[
              { value: "abajo", label: "Hacia abajo" },
              { value: "lado", label: "Hacia el lado" },
            ]}
            onChange={setPageFlow}
          />
        </Row>
      </Group>
    </div>
  );
}
