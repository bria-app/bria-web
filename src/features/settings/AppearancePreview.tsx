"use client";

import { AppPreview } from "@/features/onboarding/AppPreview";
import { LAYOUT_KEY, parseLayout } from "@/features/dashboard/layout";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { useDockSide, usePageFlow, useSectionMotion } from "@/hooks/useDevicePref";
import { useExpertMode } from "@/hooks/useExpertMode";
import { useNavMode } from "@/hooks/useNavMode";
import { useProfile } from "@/hooks/useProfile";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** The same live miniature as in onboarding, following whatever is chosen in this section. */
export function AppearancePreview() {
  const companyId = useCompanyId();
  const { user, company } = useProfile();
  const { preferred, preferredDock } = useNavMode();
  const [dockSide] = useDockSide();
  const [sectionMotion] = useSectionMotion();
  const [pageFlow] = usePageFlow();
  const [expert] = useExpertMode();
  const reduced = useReducedMotion();
  const layout = useCompanyPreference(companyId, LAYOUT_KEY, parseLayout);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold text-text-secondary">Así se ve</p>
      <AppPreview
        nav={preferred}
        dock={preferredDock}
        dockSide={dockSide}
        sectionMotion={sectionMotion}
        pageFlow={pageFlow}
        widgets={layout.value.order.filter((k) => !layout.value.hidden.includes(k))}
        expert={expert}
        firstName={user?.full_name?.trim().split(/\s+/)[0] ?? null}
        shopName={company?.name ?? "Tu tienda"}
        animate={!reduced}
      />
    </div>
  );
}
