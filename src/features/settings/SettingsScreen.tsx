"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePlan } from "@/hooks/usePlan";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useRole } from "@/hooks/useRole";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";
import { BusinessSection } from "./BusinessSection";
import { PlanSection } from "./PlanSection";
import { SectionNav, isSectionId, type SectionId } from "./SectionNav";
import { TeamSection } from "./TeamSection";

/**
 * Configuración as one screen: a list of sections on the left and the chosen one on the right.
 * The section lives in `?seccion=` so a link (or a reload) opens the same one.
 */
export function SettingsScreen({ initial = "negocio" }: { initial?: SectionId }) {
  const { isAdmin } = useRole();
  const plan = usePlan();
  const fromUrl = useQueryParam("seccion");
  const [section, setSection] = useState<SectionId>(() => (isSectionId(fromUrl) ? fromUrl : initial));

  const pick = (id: SectionId) => {
    setSection(id);
    window.history.replaceState(window.history.state, "", `/settings?seccion=${id}`);
  };

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader title="Configuración" description="Tu negocio, tu equipo, tu cuenta y tu plan." />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SectionNav value={section} onChange={pick} tags={plan.loading ? {} : { plan: plan.isPremium ? "Premium" : "Gratis" }} />
        <div key={section} className="page-enter min-w-0 flex-1">
          {section === "negocio" && <BusinessSection canEdit={isAdmin} />}
          {section === "equipo" && <TeamSection canEdit={isAdmin} />}
          {section === "cuenta" && <AccountSection />}
          {section === "apariencia" && <AppearanceSection />}
          {section === "plan" && <PlanSection />}
        </div>
      </div>
    </div>
  );
}
