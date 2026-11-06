"use client";

import { Building2, Palette, Sparkles, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionId = "negocio" | "equipo" | "cuenta" | "apariencia" | "plan";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "negocio", label: "Negocio", icon: Building2 },
  { id: "equipo", label: "Equipo y permisos", icon: Users },
  { id: "cuenta", label: "Tu cuenta", icon: UserRound },
  { id: "apariencia", label: "Apariencia", icon: Palette },
  { id: "plan", label: "Plan", icon: Sparkles },
];

export function isSectionId(v: string | null): v is SectionId {
  return SECTIONS.some((s) => s.id === v);
}

interface SectionNavProps {
  value: SectionId;
  onChange: (id: SectionId) => void;
  /** Small text next to a section (e.g. the current plan). */
  tags?: Partial<Record<SectionId, string>>;
}

/** Left list of settings sections; a wrapping grid on narrow screens (never a sideways scroll). */
export function SectionNav({ value, onChange, tags = {} }: SectionNavProps) {
  return (
    <nav
      aria-label="Secciones de configuración"
      className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:sticky lg:top-0 lg:flex lg:w-[220px] lg:shrink-0 lg:flex-col"
    >
      {SECTIONS.map((s) => {
        const on = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-current={on ? "page" : undefined}
            className={cn(
              // Two lines on a phone instead of «Equipo y permi…»; an odd last item spans the row.
              "flex min-h-10 min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm leading-snug transition-colors last:col-span-2 sm:last:col-span-1",
              on ? "bg-primary-soft font-semibold text-text-primary" : "font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
          >
            <s.icon aria-hidden className={cn("h-[17px] w-[17px] shrink-0", on && "text-accent-text")} />
            <span className="min-w-0 flex-1">{s.label}</span>
            {tags[s.id] && <span className="shrink-0 text-[11px] font-bold text-accent-text">{tags[s.id]}</span>}
          </button>
        );
      })}
    </nav>
  );
}
