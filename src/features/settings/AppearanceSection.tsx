"use client";

import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { useFirstSteps } from "@/features/first-steps/FirstStepsProvider";
import { useExpertMode } from "@/hooks/useExpertMode";
import { AppearancePreview } from "./AppearancePreview";
import { AppearanceSettings } from "./AppearanceSettings";
import { SettingsBlock } from "./SettingsBlock";

type Voice = "simple" | "tecnico";

/** Configuración › Apariencia: theme, menu and motion, plus how much technical detail to show. */
export function AppearanceSection() {
  const [expert, setExpert] = useExpertMode();
  const guide = useFirstSteps();
  const toast = useToast();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <AppearanceSettings />
        <div className="xl:sticky xl:top-0 xl:self-start">
          <AppearancePreview />
        </div>
      </div>
      <SettingsBlock title="Cómo te habla bria" hint="Se guarda en este dispositivo.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="max-w-md text-sm text-text-secondary">
            {expert
              ? "Técnico: además ves códigos internos, métricas del pronóstico y columnas extra."
              : "Simple: solo lo esencial, en palabras de todos los días."}
          </span>
          <Segmented<Voice>
            label="Cómo te habla bria"
            value={expert ? "tecnico" : "simple"}
            options={[
              { value: "simple", label: "Simple" },
              { value: "tecnico", label: "Técnico" },
            ]}
            onChange={(v) => setExpert(v === "tecnico")}
          />
        </div>
      </SettingsBlock>
      {guide.hidden && (
        <SettingsBlock title="Guía de primeros pasos" hint="La ocultaste del menú. Se guarda para toda tu empresa.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="max-w-md text-sm text-text-secondary">Te acompaña con lo que falta para poner en marcha tu tienda.</span>
            <Button
              variant="secondary"
              onClick={() =>
                void guide
                  .setHidden(false)
                  .then(() => toast("La guía volvió a tu menú"))
                  .catch(() => toast("No se pudo mostrar la guía."))
              }
            >
              Mostrar de nuevo
            </Button>
          </div>
        </SettingsBlock>
      )}
    </div>
  );
}
