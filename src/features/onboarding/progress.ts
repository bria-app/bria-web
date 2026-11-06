/**
 * Onboarding state. A brand-new account is sent to the full-screen welcome flow (/welcome).
 * Progress and completion are saved server-side (company preference "onboarding"), so the
 * flow resumes where it was left and a second device doesn't repeat it. The local flag only
 * covers the moment between sign-up and the first server read.
 */

const ONBOARDING_KEY = "dss-onboarding";
export const ONBOARDING_PREF = "onboarding";

export interface OnboardingPref {
  /** Last step reached in /welcome, to resume there. */
  step?: number;
  completed_at?: string;
  /** «Terminar después»: not finished, but don't send them back to /welcome on their own. */
  left_at?: string;
  /** The «Primeros pasos» card on Hoy was closed. */
  first_steps_hidden?: boolean;
}

/** The stored preference, tolerating older shapes (anything that isn't an object). */
export function parseOnboardingPref(raw: unknown): OnboardingPref {
  return raw && typeof raw === "object" ? (raw as OnboardingPref) : {};
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the flow still works for this session */
  }
}

/** Call right after a successful registration. */
export const markOnboardingPending = () => write(ONBOARDING_KEY, "pending");
export const isOnboardingPending = () => read(ONBOARDING_KEY) === "pending";
export const completeOnboarding = () => write(ONBOARDING_KEY, "done");
