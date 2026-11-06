"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useRole } from "@/hooks/useRole";
import { suppliersApi } from "@/services/api/resources";
import { ftgmApi } from "@/services/api/forecasting";
import { posApi } from "@/services/api/pos";
import { purchasingApi } from "@/services/api/purchasing";
import { usersApi } from "@/services/api/users";
import { ONBOARDING_PREF, parseOnboardingPref } from "@/features/onboarding/progress";
import { buildSteps, type FirstStep } from "./steps";

interface FirstStepsValue {
  /** Owner with steps still pending and the guide not hidden. */
  available: boolean;
  steps: FirstStep[];
  doneCount: number;
  next: FirstStep | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  hidden: boolean;
  setHidden: (hidden: boolean) => Promise<void>;
}

const FirstStepsContext = createContext<FirstStepsValue | null>(null);

/**
 * The «Primeros pasos» guide shared by the menu launcher and the side panel. Progress comes
 * from real counts and refreshes on every navigation, so steps tick themselves as the shop works.
 */
export function FirstStepsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const companyId = useCompanyId();
  const { isSeller } = useRole();
  const pref = useCompanyPreference(companyId, ONBOARDING_PREF, parseOnboardingPref);
  // «Ir a Hoy» at the end of /welcome links to /dashboard?primeros=1. Read through the router: right
  // after an in-app navigation `window.location` still holds the previous page's address.
  const asked = useQueryParam("primeros") === "1";
  const [openState, setOpenState] = useState(false);
  // The flag opens the guide once. Removing it with history.replaceState does not update the
  // router's search params, so the flag can stay «true»: without this, closing did nothing.
  const [flagConsumed, setFlagConsumed] = useState(false);
  const open = openState || (asked && !flagConsumed);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next && asked) setFlagConsumed(true);
    if (!next && asked) {
      // Consumed: drop the flag so a reload or the back button does not reopen the guide.
      const url = new URL(window.location.href);
      url.searchParams.delete("primeros");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  };
  const enabled = !!companyId && !isSeller && !pref.loading && !pref.value.first_steps_hidden;

  const counts = useApi(
    () =>
      companyId && enabled
        ? Promise.all([
            posApi.catalog(companyId, "", 1),
            posApi.list(companyId, { page: 1, size: 1 }),
            suppliersApi.list(companyId),
            purchasingApi.documents(companyId, { page: 1, size: 1 }),
            usersApi.list(companyId),
            ftgmApi.listRuns(companyId, 10),
          ]).then(([catalog, orders, suppliers, purchases, users, runs]) => ({
            products: catalog.length,
            tickets: orders.total,
            suppliers: suppliers.length,
            purchases: purchases.total,
            people: users.length,
            forecasts: runs.filter((r) => r.status === "success").length,
          }))
        : Promise.resolve(null),
    [companyId, enabled, pathname, open],
  );

  const steps = counts.data
    ? buildSteps({ ...counts.data, setupDone: !!pref.value.completed_at, setupStarted: !!pref.value.step })
    : [];
  const doneCount = steps.filter((s) => s.done).length;

  const value: FirstStepsValue = {
    available: enabled && steps.length > 0 && doneCount < steps.length,
    steps,
    doneCount,
    next: steps.find((s) => !s.done) ?? null,
    open: open && enabled && steps.length > 0,
    setOpen,
    hidden: !!pref.value.first_steps_hidden,
    setHidden: (hidden) => pref.save({ ...pref.value, first_steps_hidden: hidden }),
  };

  return <FirstStepsContext.Provider value={value}>{children}</FirstStepsContext.Provider>;
}

export function useFirstSteps(): FirstStepsValue {
  const value = useContext(FirstStepsContext);
  if (!value) throw new Error("useFirstSteps must be used inside <FirstStepsProvider>");
  return value;
}
