"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyPreference } from "@/hooks/useCompanyPreference";
import { loadCompany, loadCurrentUser } from "@/hooks/useProfile";
import { categoriesApi, productsApi, salesApi } from "@/services/api/resources";
import { customFieldsApi } from "@/services/api/custom-fields";
import { usersApi } from "@/services/api/users";
import { ONBOARDING_PREF, completeOnboarding, parseOnboardingPref, type OnboardingPref } from "./progress";
import { businessByLabel } from "./businesses";

export const STEPS = [
  { id: "intro", label: "Hola" },
  { id: "business", label: "Rubro" },
  { id: "store", label: "Tu tienda" },
  { id: "setup", label: "Ajustes" },
  { id: "products", label: "Productos" },
  { id: "sales", label: "Ventas pasadas" },
  { id: "team", label: "Equipo" },
  { id: "look", label: "A tu gusto" },
  { id: "done", label: "Listo" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

const LAST = STEPS.length - 1;

/**
 * Everything the welcome flow shows comes from the API (company, catalog, imported sales,
 * team), so every step reflects what is really saved. The step reached is stored in the
 * company preference to resume on any device.
 */
export function useWelcome() {
  const router = useRouter();
  const companyId = useCompanyId();
  const me = useApi(loadCurrentUser, []);
  const company = useApi(() => (companyId ? loadCompany(companyId) : Promise.resolve(null)), [companyId]);
  const products = useApi(() => (companyId ? productsApi.list(companyId) : Promise.resolve(null)), [companyId]);
  const sales = useApi(() => (companyId ? salesApi.list(companyId, 1, 1, "imported") : Promise.resolve(null)), [companyId]);
  const categories = useApi(() => (companyId ? categoriesApi.list(companyId) : Promise.resolve(null)), [companyId]);
  const fields = useApi(() => (companyId ? customFieldsApi.list(companyId, "product") : Promise.resolve(null)), [companyId]);
  const team = useApi(() => (companyId ? usersApi.list(companyId) : Promise.resolve(null)), [companyId]);
  const pref = useCompanyPreference(companyId, ONBOARDING_PREF, parseOnboardingPref);

  // Until the person moves, show the step saved on the server (the start for a new account,
  // or for someone reviewing a setup they already finished).
  const [chosen, setChosen] = useState<number | null>(null);
  const saved = pref.value.completed_at ? 0 : Math.min(Math.max(pref.value.step ?? 0, 0), LAST - 1);
  const index = chosen ?? saved;

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), LAST);
    setChosen(clamped);
    window.scrollTo({ top: 0 });
    if (clamped !== LAST) pref.save({ ...pref.value, step: clamped }).catch(() => undefined);
  };

  // Leaving waits for the server to store the outcome: the shell checks it on the next screen and
  // would otherwise send a shop without products straight back here.
  const [leaving, setLeaving] = useState(false);
  const exit = async (next: OnboardingPref, to: string) => {
    if (leaving) return;
    setLeaving(true);
    completeOnboarding();
    await pref.save(next).catch(() => undefined);
    router.push(to);
  };

  const finish = (to: string) => void exit({ ...pref.value, step: LAST, completed_at: new Date().toISOString() }, to);
  const leave = () => void exit({ ...pref.value, step: index, left_at: new Date().toISOString() }, "/dashboard");

  return {
    companyId,
    loading: pref.loading,
    /** The company could not be loaded (the flow cannot start without it). */
    error: company.loading ? null : company.error,
    leaving,
    index,
    step: STEPS[index].id as StepId,
    goTo,
    next: () => goTo(index + 1),
    back: () => goTo(index - 1),
    finish,
    leave,
    firstName: me.data?.full_name?.trim().split(/\s+/)[0] ?? null,
    company: company.data,
    business: businessByLabel(company.data?.business_type),
    businessLabel: company.data?.business_type || null,
    productCount: products.data ? products.data.length : null,
    hasSales: sales.data ? sales.data.length > 0 : null,
    categories: categories.data ?? [],
    fields: fields.data ?? [],
    team: (team.data ?? []).filter((u) => u.id !== me.data?.id),
    reload: {
      company: company.reload,
      products: products.reload,
      sales: sales.reload,
      setup: () => {
        categories.reload();
        fields.reload();
      },
      team: team.reload,
    },
  };
}

export type Welcome = ReturnType<typeof useWelcome>;
