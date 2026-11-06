import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppMark, Wordmark } from "@/components/brand/Wordmark";
import { OWNER_FOOTER_NAV, OWNER_NAV, OWNER_DOCK } from "@/components/layout/navigation";
import { WIDGET_TITLES, type WidgetKey } from "@/features/dashboard/types";
import type { DockSide, PageFlow, SectionMotion } from "@/hooks/useDevicePref";
import type { DockStyle, NavMode } from "@/hooks/useNavMode";
import { packWidgets } from "@/features/dashboard/layout";
import { soles } from "@/lib/format";
import { greeting } from "@/lib/lima";
import { cn } from "@/lib/utils";
import { PageScene, SectionScene } from "./DemoScenes";
import { useDemoBeat, type PreviewDemo } from "./motionChoices";

interface AppPreviewProps {
  nav: NavMode;
  dock: DockStyle;
  widgets: WidgetKey[];
  expert: boolean;
  firstName: string | null;
  shopName: string;
  /** Changes animate (layout swaps, cards appearing) unless motion is reduced. */
  animate: boolean;
  dockSide: DockSide;
  sectionMotion: SectionMotion;
  pageFlow: PageFlow;
  /** A movement preference to act out for a moment instead of the usual Hoy (onboarding). */
  demo?: PreviewDemo | null;
  /** Called when the demo has played through. */
  onDemoEnd?: () => void;
  /** «lg» is taller, for a preview that has a column of its own. */
  size?: "md" | "lg";
}

/** A sample of the inventory list. */
function MiniList({ pop }: { pop: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1 rounded-lg border border-border bg-surface p-2", pop && "pop-in")}>
      <span className="text-[7.5px] font-semibold text-text-primary">Inventario</span>
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-1.5 border-t border-border pt-1">
          <span className="h-3 w-3 rounded-[3px] bg-surface-muted" />
          <span className="h-1.5 flex-1 rounded-full bg-surface-muted" />
          <span className="h-1.5 w-6 rounded-full bg-text-secondary/40" />
        </span>
      ))}
    </div>
  );
}

/** How each Hoy card looks in miniature. */
const CARD: Record<WidgetKey, { body: "figure" | "list" | "bars" | "tiles" }> = {
  caja: { body: "figure" },
  todo: { body: "list" },
  top: { body: "bars" },
  activity: { body: "list" },
  month: { body: "tiles" },
};

/** Sample figures for the miniature; it never shows the shop's real numbers. */
const SAMPLE_TOTAL = soles(1284.5);
const SAMPLE_BARS = [3, 5, 4, 7, 6, 9, 8, 5, 6];

function MiniCard({ k, span, pop }: { k: WidgetKey; span: number; pop: boolean }) {
  const c = CARD[k];
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-surface p-2", pop && "pop-in")} style={{ gridColumn: `span ${span} / span ${span}` }}>
      <span className="truncate text-[7.5px] font-semibold text-text-primary">{WIDGET_TITLES[k]}</span>
      {c.body === "figure" && (
        <>
          <span className="font-mono text-[11px] leading-none text-text-primary">{SAMPLE_TOTAL}</span>
          <span className="flex h-5 items-end gap-[2px]">
            {SAMPLE_BARS.map((h, i) => (
              <span key={i} className="flex-1 rounded-t-[1px] bg-primary" style={{ height: `${h * 10}%` }} />
            ))}
          </span>
        </>
      )}
      {c.body === "list" &&
        [70, 55, 62].map((w, i) => <span key={i} className="h-1.5 rounded-full bg-surface-muted" style={{ width: `${w}%` }} />)}
      {c.body === "bars" &&
        [90, 64, 40].map((w, i) => <span key={i} className="h-1 rounded-full bg-text-secondary/50" style={{ width: `${w}%` }} />)}
      {c.body === "tiles" && (
        <span className="grid grid-cols-2 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-3 rounded-[3px] bg-surface-soft" />
          ))}
        </span>
      )}
    </div>
  );
}

/** A miniature bria that follows every choice: theme (real tokens), menu, dock, Hoy's cards and wording. */
export function AppPreview(p: AppPreviewProps) {
  const { nav, dock, widgets, expert, firstName, shopName, animate, dockSide, sectionMotion, pageFlow, demo = null, onDemoEnd, size = "md" } = p;
  const beat = useDemoBeat(demo, animate, onDemoEnd);
  const dockLeft = nav === "dock" && dockSide === "izquierda";
  const sliding = sectionMotion === "deslizar" && animate && !demo;
  // Which section the miniature is on: the demos of sections and lists visit Inventario.
  const onInventory = demo?.kind === "section" && beat % 2 === 1;
  const activeHref = onInventory ? "/inventory" : "/dashboard";
  const swipeHint = demo?.kind === "section" ? demo.value === "deslizar" : sectionMotion === "deslizar" && !demo;
  const pagesHint = pageFlow === "lado" && !demo;
  const docked = nav === "dock";
  const dockItems = dock === "completo" ? [...OWNER_NAV, ...OWNER_FOOTER_NAV] : OWNER_NAV.filter((i) => OWNER_DOCK.includes(i.href));
  const half = Math.ceil(dockItems.length / 2);
  // Same greeting as Hoy, by Lima time (taken once: the preview is not a clock).
  const [hello] = useState(() => greeting(new Date()));

  const greetingBlock = (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[12px] font-bold leading-tight text-text-primary">
        {hello}
        {firstName ? `, ${firstName}` : ""}
      </span>
      <span key={String(expert)} className={cn("text-[7.5px] text-text-secondary", animate && "pop-in")}>
        {expert ? "Cobertura de inventario: 6 d · MASE 0.82 · 2 en quiebre" : "Te alcanza para 6 días · 2 productos se acabaron"}
      </span>
    </div>
  );
  const cards =
    widgets.length === 0 ? (
      <span className="grid flex-1 place-items-center rounded-lg border border-dashed border-border text-[7.5px] text-text-muted">
        Ocultaste todo: Hoy quedará vacío
      </span>
    ) : (
      <div className="grid grid-cols-12 gap-1.5">
        {packWidgets(widgets, undefined).map(({ key, span }) => (
          <MiniCard key={key} k={key} span={span} pop={animate} />
        ))}
      </div>
    );

  return (
    <div aria-label="Vista previa de bria con tus elecciones" role="img" className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-soft-xl">
      {/* Window chrome. */}
      <div className="flex h-6 items-center gap-1 border-b border-border bg-surface-soft px-2.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-text-muted/40" />
        ))}
      </div>

      <div className={cn("flex", size === "lg" ? "h-[240px] sm:h-[320px] lg:h-[380px] xl:h-[440px]" : "h-[340px]")}>
        {!docked && (
          <aside
            key={nav}
            className={cn("flex shrink-0 flex-col gap-1 border-r border-border bg-surface-soft p-1.5", nav === "riel" ? "w-9" : "w-[104px]", animate && "pop-in")}
          >
            <div className="mb-1 flex items-center gap-1">
              <AppMark className="h-5 w-5 rounded-md text-[10px]" />
              {nav === "lateral" && (
                <span className="flex min-w-0 flex-col leading-none">
                  <Wordmark className="text-[9px]" />
                  <span className="truncate text-[6px] text-text-muted">{shopName}</span>
                </span>
              )}
            </div>
            {OWNER_NAV.map((item) => (
              <span
                key={item.href}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1 py-[3px] transition-colors",
                  item.href === activeHref ? "bg-surface text-text-primary" : "text-text-secondary",
                  nav === "riel" && "justify-center",
                )}
              >
                <item.icon aria-hidden className={cn("h-2.5 w-2.5 shrink-0", item.href === activeHref && "text-accent-text")} />
                {nav === "lateral" && <span className="truncate text-[7px] font-medium">{item.label}</span>}
              </span>
            ))}
          </aside>
        )}

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex h-7 items-center justify-between border-b border-border px-2.5">
            <span className="text-[7.5px] font-semibold text-text-primary">{onInventory ? "Inventario" : "Hoy"}</span>
            <span className="flex items-center gap-0.5 rounded-md bg-primary px-1.5 py-0.5 text-[7px] font-semibold text-on-primary">
              <Plus aria-hidden className="h-2 w-2" /> Crear
            </span>
          </div>
          {demo ? (
            <div key={`${demo.kind}-${demo.run}`} className={cn("flex min-h-0 flex-1 flex-col", dockLeft && "pl-10", docked && !dockLeft && "pb-8")}>
              {demo.kind === "section" && <SectionScene value={demo.value} beat={beat} home={<>{greetingBlock}{cards}</>} />}
              {demo.kind === "page" && <PageScene value={demo.value} beat={beat} greeting={greetingBlock} />}
            </div>
          ) : (
            <div className={cn("relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2.5", dockLeft && "pl-12", sliding && "pv-slide")}>
              {greetingBlock}
              {cards}
              <MiniList pop={animate} />
            </div>
          )}

          {pagesHint && (
            <span key="pages" aria-hidden className={cn("absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-border bg-surface px-1.5 py-1", animate && "pop-in")}>
              <ChevronLeft className="h-2 w-2 text-text-muted" />
              <span className="relative h-[3px] w-8 rounded-full bg-surface-muted">
                <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-text-muted/70" />
              </span>
              <ChevronRight className="h-2 w-2 text-text-muted" />
            </span>
          )}
          {swipeHint && (
            <span className="absolute right-2 top-9 flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-[6.5px] font-semibold text-text-secondary">
              <ChevronLeft aria-hidden className="h-2 w-2" /> desliza <ChevronRight aria-hidden className="h-2 w-2" />
            </span>
          )}
          {docked && (
            <div
              key={`${dock}-${dockSide}`}
              className={cn(
                "absolute flex items-center gap-0.5 rounded-xl bg-strong p-1",
                dockLeft ? "left-2 top-1/2 -translate-y-1/2 flex-col" : "bottom-2 left-1/2 -translate-x-1/2",
                animate && (dockLeft ? "dock-in-left" : "dock-in"),
              )}
            >
              {dockItems.slice(0, half).map((item) => (
                <span key={item.href} className="grid h-5 w-5 place-items-center text-strong-foreground/75">
                  <item.icon aria-hidden className="h-2.5 w-2.5" />
                </span>
              ))}
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-on-primary">
                <Plus aria-hidden className="h-3 w-3" />
              </span>
              {dockItems.slice(half).map((item) => (
                <span key={item.href} className="grid h-5 w-5 place-items-center text-strong-foreground/75">
                  <item.icon aria-hidden className="h-2.5 w-2.5" />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
