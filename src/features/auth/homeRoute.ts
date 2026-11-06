import { getRole } from "@/services/auth";
import { isOnboardingPending } from "@/features/onboarding/progress";

/** Where a signed-in person starts: sellers at the till, new accounts in the welcome flow, owners in Hoy. */
export function homeRoute(): string {
  if (getRole() === "seller") return "/sales/new";
  return isOnboardingPending() ? "/welcome" : "/dashboard";
}
