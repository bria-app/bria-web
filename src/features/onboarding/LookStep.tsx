"use client";

import { useCallback, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { LAYOUT_KEY, parseLayout } from "@/features/dashboard/layout";
import type { HomeLayout } from "@/features/dashboard/types";
import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { useExpertMode } from "@/hooks/useExpertMode";
import { useNavMode, type DockStyle, type NavMode } from "@/hooks/useNavMode";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDockSide, usePageFlow, useSectionMotion, type DockSide } from "@/hooks/useDevicePref";
import { getModePref, getMotion, setModePref, setMotion, type ModePref, type Motion } from "@/lib/appearance";
import { AppPreview } from "./AppPreview";
import { HomeCardsList } from "./HomeCardsList";
import { MotionChoice } from "./MotionChoice";
import { DEMO_ROWS, PAGE_ROW, SECTION_ROW, type DemoPick, type PreviewDemo } from "./motionChoices";
import { StepActions, StepHeading } from "./StepHeading";

interface LookStepProps {
  companyId: string | null;
  firstName: string | null;
  shopName: string;
  onBack: () => void;
  onNext: () => void;
}

function Choice({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div>
        <p className="text-[14px] font-semibold text-text-primary">{label}</p>
        {hint && <p className="text-[12.5px] text-text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 className="font-display text-[18px] font-bold tracking-[-0.01em] text-text-primary">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** What the preview is acting out, in words, with a way to see it again. */
function DemoCaption({ demo, chosen, canReplay, onReplay }: { demo: PreviewDemo | null; chosen: string | null; canReplay: boolean; onReplay: () => void }) {
  if (!demo) {
    return <p className="text-[12.5px] text-text-muted">Pasa el cursor o toca una opción de «Cómo te mueves» para verla aquí.</p>;
  }
  const row = DEMO_ROWS[demo.kind];
  const option = row.options.find((o) => o.value === demo.value) ?? row.options[0];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-text-primary">
          {row.label}: {option.label}
          {demo.value !== chosen && <span className="font-normal text-text-muted"> · sin elegir</span>}
        </p>
        <p className="hidden text-[12.5px] leading-snug text-text-secondary sm:block">{option.text}</p>
      </div>
      {canReplay && (
        <Button variant="ghost" size="sm" onClick={onReplay} className="shrink-0">
          <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Ver de nuevo
        </Button>
      )}
    </div>
  );
}

/**
 * «A tu gusto»: how bria looks and moves, with a live miniature beside the controls. Theme, menu,
 * dock, wording and motion are this device's (applied at once); Hoy's cards are the company's.
 * The movement options are acted out in the miniature when pointed at, focused or picked.
 */
export function LookStep({ companyId, firstName, shopName, onBack, onNext }: LookStepProps) {
  const [mode, setModeState] = useState<ModePref>(getModePref);
  const [motion, setMotionState] = useState<Motion>(getMotion);
  const { preferred, setMode: setNav, preferredDock, setDockStyle } = useNavMode();
  const [expert, setExpert] = useExpertMode();
  const reduced = useReducedMotion();
  const [dockSide, setDockSide] = useDockSide();
  const [sectionMotion, setSectionMotion] = useSectionMotion();
  const [pageFlow, setPageFlow] = usePageFlow();
  const layout = useCompanyPreference(companyId, LAYOUT_KEY, parseLayout);
  const visible = layout.value.order.filter((k) => !layout.value.hidden.includes(k));

  const toast = useToast();
  const saveLayout = (next: HomeLayout) =>
    void layout.save(next).catch((err: unknown) => toast(`No se guardó el orden de Hoy. ${err instanceof Error ? err.message : "Inténtalo de nuevo."}`));

  // The last demo stays named under the preview (to replay it) after it has played through.
  const [show, setShow] = useState<{ demo: PreviewDemo | null; playing: boolean }>({ demo: null, playing: false });
  const play = useCallback(
    (pick: DemoPick) =>
      setShow((s) =>
        s.playing && s.demo?.kind === pick.kind && s.demo.value === pick.value ? s : { demo: { ...pick, run: (s.demo?.run ?? 0) + 1 } as PreviewDemo, playing: true },
      ),
    [],
  );
  const replay = () => setShow((s) => (s.demo ? { demo: { ...s.demo, run: s.demo.run + 1 }, playing: true } : s));
  const endDemo = useCallback(() => setShow((s) => ({ ...s, playing: false })), []);
  const chosen = show.demo ? { section: sectionMotion, page: pageFlow }[show.demo.kind] : null;

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker="Paso 7 · A tu gusto"
        title="Haz que bria se vea como tú quieres"
        text="Cambia algo y míralo al instante en la vista previa. Todo esto lo vuelves a cambiar cuando quieras en Configuración."
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:gap-10">
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
          <Group title="Cómo se ve">
            <Choice label="Tema">
              <Segmented<ModePref>
                label="Tema"
                value={mode}
                options={[
                  { value: "light", label: "Claro" },
                  { value: "dark", label: "Oscuro" },
                  { value: "system", label: "Como el sistema" },
                ]}
                onChange={(v) => {
                  setModeState(v);
                  setModePref(v);
                }}
              />
            </Choice>

            <Choice label="Menú" hint="El dock pone botones grandes abajo: ideal para el mostrador o una tablet.">
              <Segmented<NavMode>
                label="Menú"
                value={preferred}
                options={[
                  { value: "lateral", label: "Barra lateral" },
                  { value: "riel", label: "Solo íconos" },
                  { value: "dock", label: "Dock" },
                ]}
                onChange={setNav}
              />
              {preferred === "dock" && (
                <div className="flex flex-wrap gap-2">
                  <Segmented<DockStyle>
                    label="Tipo de dock"
                    value={preferredDock}
                    options={[
                      { value: "simple", label: "Dock simple" },
                      { value: "completo", label: "Dock completo" },
                    ]}
                    onChange={setDockStyle}
                  />
                  <Segmented<DockSide>
                    label="Posición del dock"
                    value={dockSide}
                    options={[
                      { value: "abajo", label: "Abajo" },
                      { value: "izquierda", label: "A la izquierda" },
                    ]}
                    onChange={setDockSide}
                  />
                </div>
              )}
            </Choice>

            <div className="grid gap-5 sm:grid-cols-2">
              <Choice label="Cómo te habla bria" hint={expert ? "Técnico: métricas del pronóstico y códigos." : "Simple: palabras de todos los días."}>
                <Segmented<"simple" | "tecnico">
                  label="Cómo te habla bria"
                  value={expert ? "tecnico" : "simple"}
                  options={[
                    { value: "simple", label: "Simple" },
                    { value: "tecnico", label: "Técnico" },
                  ]}
                  onChange={(v) => setExpert(v === "tecnico")}
                />
              </Choice>
              <Choice label="Animaciones" hint={motion === "reduced" ? "Todo aparece sin moverse." : "Transiciones y detalles en movimiento."}>
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
              </Choice>
            </div>
          </Group>

          <Group title="Cómo te mueves" hint="Cada opción se ve en acción en la vista previa.">
            <MotionChoice row={SECTION_ROW} value={sectionMotion} onChange={setSectionMotion} onPreview={(value) => play({ kind: "section", value })} />
            <MotionChoice row={PAGE_ROW} value={pageFlow} onChange={setPageFlow} onPreview={(value) => play({ kind: "page", value })} />
          </Group>

          <Group title="Tu pantalla de inicio" hint="Qué tarjetas ves en Hoy y en qué orden. Vale para todo tu equipo.">
            <HomeCardsList layout={layout.value} onChange={saveLayout} />
          </Group>
        </div>

        {/* Stays in view while the options scroll: beside them on large screens, on top on small ones. */}
        <div className="sticky top-[68px] z-10 order-1 -mx-4 flex flex-col gap-3 bg-background/95 px-4 pb-3 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-24 lg:order-2 lg:mx-0 lg:self-start lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:backdrop-blur-none">
          <p className="text-[13px] font-semibold text-text-secondary">Así se verá</p>
          <AppPreview
            nav={preferred}
            dock={preferredDock}
            widgets={visible}
            expert={expert}
            firstName={firstName}
            shopName={shopName}
            animate={!reduced}
            dockSide={dockSide}
            sectionMotion={sectionMotion}
            pageFlow={pageFlow}
            demo={show.playing ? show.demo : null}
            onDemoEnd={endDemo}
            size="lg"
          />
          <DemoCaption demo={show.demo} chosen={chosen} canReplay={!reduced} onReplay={replay} />
        </div>
      </div>

      <StepActions onBack={onBack} onNext={onNext} nextLabel="Me gusta así" />
    </div>
  );
}
