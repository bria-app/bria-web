import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { WIDGET_TITLES } from "@/features/dashboard/types";
import type { PageFlow, SectionMotion } from "@/hooks/useDevicePref";
import { cn } from "@/lib/utils";

/* Short demos the miniature plays for «Cambio de sección» and «La página».
   Only transform and opacity move; with reduced motion each one holds a single still frame. */

const NAME_WIDTHS = [72, 54, 64, 48, 80, 58, 68, 50, 76, 60, 66, 52];
const BARS = [3, 5, 4, 7, 6, 9, 8, 5, 6, 8, 7, 9];

function Piece({ title, className, children }: { title: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-surface p-2", className)}>
      <span className="truncate text-[7.5px] font-semibold text-text-primary">{title}</span>
      {children}
    </div>
  );
}

function Lines({ widths }: { widths: number[] }) {
  return widths.map((w, i) => <span key={i} className="h-1.5 rounded-full bg-surface-muted" style={{ width: `${w}%` }} />);
}

function Bars({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-end gap-[2px]", className)}>
      {BARS.map((h, i) => (
        <span key={i} className="flex-1 rounded-t-[1px] bg-primary" style={{ height: `${h * 10}%` }} />
      ))}
    </span>
  );
}

function Row({ i, className, style }: { i: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-1.5 border-t border-border py-1", className)} style={style}>
      <span className="h-3 w-3 shrink-0 rounded-[3px] bg-surface-muted" />
      <span className="h-1.5 rounded-full bg-surface-muted" style={{ width: `${NAME_WIDTHS[i % NAME_WIDTHS.length] * 0.6}%` }} />
      <span className="ml-auto font-mono text-[6.5px] text-text-secondary">{(i * 7 + 4) % 40}</span>
      <span className="h-1.5 w-5 rounded-full bg-text-secondary/40" />
    </span>
  );
}

/** A vertical scrollbar whose thumb (`size` of the track) sits at `pos` (0 top … 1 bottom). */
function ScrollThumb({ pos, size }: { pos: number; size: number }) {
  return (
    <span aria-hidden className="absolute bottom-1 right-1 top-1 w-[3px] rounded-full bg-surface-muted">
      <span
        className="block rounded-full bg-text-muted/70 transition-transform duration-700 ease-in-out"
        style={{ height: `${size * 100}%`, transform: `translateY(${(pos * (1 - size) * 100) / size}%)` }}
      />
    </span>
  );
}

/** Inventario as a table, as the miniature shows it. */
function InventoryList() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface px-2 pb-1 pt-1.5">
      <span className="flex shrink-0 justify-between pb-1 pr-2 text-[6.5px] font-semibold text-text-muted">
        <span>Producto</span>
        <span>Tienes · Precio</span>
      </span>
      <div className="relative min-h-0 flex-1 overflow-hidden pr-2">
        <div className="absolute inset-x-0 top-0 flex h-[238%] flex-col justify-between">
          {Array.from({ length: 14 }, (_, i) => (
            <Row key={i} i={i} />
          ))}
        </div>
      </div>
      <ScrollThumb pos={0} size={0.42} />
    </div>
  );
}

/** The Inventario screen: its title, the search bar and the list (three blocks, so they enter in turn). */
function InventoryScreen() {
  return (
    <>
      <span className="font-display text-[12px] font-bold leading-tight text-text-primary">Inventario</span>
      <span className="flex items-center gap-1">
        <span className="flex h-4 flex-1 items-center gap-1 rounded-md border border-border bg-surface px-1.5 text-text-muted">
          <Search aria-hidden className="h-2 w-2" />
          <span className="h-1 w-10 rounded-full bg-surface-muted" />
        </span>
        <span className="h-4 w-8 rounded-full bg-strong" />
        <span className="h-4 w-8 rounded-full border border-border" />
      </span>
      <InventoryList />
    </>
  );
}

/** «Cambio de sección»: Hoy → Inventario → Hoy → Inventario, each arriving the chosen way. */
export function SectionScene({ value, beat, home }: { value: SectionMotion; beat: number; home: ReactNode }) {
  const inventory = beat % 2 === 1;
  // Same classes as the real shell. Hoy sits before Inventario in the menu, so going back to it
  // with «Deslizar» it comes in from the left.
  const entrance = beat === 0 ? undefined : value === "deslizar" ? cn("page-slide", inventory ? "page-slide-next" : "page-slide-prev") : "page-enter";
  return (
    <div key={beat} className={cn("min-h-0 flex-1 overflow-hidden", entrance)}>
      <div className="flex h-full flex-col gap-2 p-2.5">{inventory ? <InventoryScreen /> : home}</div>
    </div>
  );
}

/**
 * «Hacia el lado» as one strip of columns that keeps going right: cards first, then a chart across
 * two columns, then a table. About two and a half columns are in view, so the next one peeks in.
 */
function SidewaysStrip({ greeting }: { greeting: ReactNode }) {
  return (
    <>
      <div className="flex h-full w-1/6 shrink-0 flex-col gap-2 pr-2">
        {greeting}
        <Piece title={WIDGET_TITLES.caja} className="flex-1">
          <Bars className="min-h-0 flex-1" />
        </Piece>
      </div>
      <div className="flex h-full w-1/6 shrink-0 flex-col gap-2 pr-2">
        <Piece title={WIDGET_TITLES.todo} className="flex-1">
          <Lines widths={[70, 55, 62, 48]} />
        </Piece>
        <Piece title={WIDGET_TITLES.top} className="flex-1">
          <Lines widths={[90, 64, 40]} />
        </Piece>
      </div>
      <div className="flex h-full w-2/6 shrink-0 pr-2">
        <Piece title={WIDGET_TITLES.month} className="flex-1">
          <Bars className="min-h-0 flex-1" />
        </Piece>
      </div>
      <div className="flex h-full w-2/6 shrink-0">
        <Piece title="Inventario" className="flex-1 overflow-hidden">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Row key={i} i={i} />
          ))}
        </Piece>
      </div>
    </>
  );
}

/** A slim sideways rail under the strip, `pos` 0…1 along it, `size` the share in view. */
function SideThumb({ pos, size }: { pos: number; size: number }) {
  return (
    <span aria-hidden className="absolute bottom-1.5 left-1/2 h-[3px] w-16 -translate-x-1/2 rounded-full bg-surface-muted">
      <span
        className="block h-full rounded-full bg-text-muted/70 transition-transform duration-[1400ms] ease-in-out"
        style={{ width: `${size * 100}%`, transform: `translateX(${(pos * (1 - size) * 100) / size}%)` }}
      />
    </span>
  );
}

/** «La página»: a long Hoy scrolls down, or goes on to the right as one strip that glides along. */
export function PageScene({ value, beat, greeting }: { value: PageFlow; beat: number; greeting: ReactNode }) {
  const step = Math.min(beat, 2);
  if (value === "abajo") {
    const size = 1 / 2.3;
    const pos = step / 2;
    return (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 flex h-[230%] flex-col gap-2 p-2.5 pr-4 transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${pos * (1 - size) * 100}%)` }}
        >
          {greeting}
          <div className="grid grid-cols-2 gap-1.5">
            <Piece title={WIDGET_TITLES.caja}>
              <Bars className="h-6" />
            </Piece>
            <Piece title={WIDGET_TITLES.todo}>
              <Lines widths={[70, 55, 62]} />
            </Piece>
          </div>
          <Piece title={WIDGET_TITLES.month} className="flex-1">
            <Bars className="min-h-0 flex-1" />
          </Piece>
          <Piece title="Inventario" className="flex-1 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <Row key={i} i={i} />
            ))}
          </Piece>
        </div>
        <ScrollThumb pos={pos} size={size} />
      </div>
    );
  }
  // About 2.4 of the strip's 6 column widths are in view: it glides from the first to the last.
  const size = 2.4 / 6;
  const pos = step / 2;
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden p-2.5 pb-6">
      <div className="flex h-full w-[250%] transition-transform duration-[1400ms] ease-in-out" style={{ transform: `translateX(-${pos * (1 - size) * 100}%)` }}>
        <SidewaysStrip greeting={greeting} />
      </div>
      <SideThumb pos={pos} size={size} />
    </div>
  );
}
