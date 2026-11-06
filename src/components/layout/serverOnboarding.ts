import { getCompanyId } from "@/services/auth";
import { ONBOARDING_PREF, markOnboardingPending, parseOnboardingPref } from "@/features/onboarding/progress";
import { productsApi } from "@/services/api/resources";
import { preferencesApi } from "@/services/api/custom-fields";

const CHECKED_KEY = "dss-onboarding-checked";

/**
 * Once per browser session: an account that never finished (nor left) the welcome flow and still
 * has no products is sent to it. Offline or without access, the app is never blocked on this.
 */
export async function checkServerOnboarding(go: (to: string) => void): Promise<void> {
  try {
    if (window.sessionStorage.getItem(CHECKED_KEY)) return;
    window.sessionStorage.setItem(CHECKED_KEY, "1");
  } catch {
    return;
  }
  const companyId = getCompanyId();
  if (!companyId) return;
  try {
    const [pref, products] = await Promise.all([preferencesApi.get(companyId, ONBOARDING_PREF), productsApi.list(companyId)]);
    const state = parseOnboardingPref(pref.value);
    if (!state.completed_at && !state.left_at && products.length === 0) {
      markOnboardingPending();
      go("/welcome");
    }
  } catch {
    // Offline or no access: the app opens as usual.
  }
}
