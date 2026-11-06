/**
 * Appearance preferences (color mode and motion) live on <html> attributes
 * and in localStorage. These helpers are framework-free, so the login page, the
 * onboarding and Configuración share exactly the same behaviour (the root layout's inline
 * script restores both before the first paint).
 */

export type ModePref = "light" | "dark" | "system";
export type Motion = "full" | "reduced";

const KEYS = { mode: "dss-mode", motion: "dss-motion" } as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked — the attribute still applies for this session */
  }
}

const root = () => document.documentElement;

export function resolveMode(pref: ModePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getModePref(): ModePref {
  const v = read(KEYS.mode);
  return v === "dark" || v === "system" ? v : "light";
}

export function setModePref(pref: ModePref) {
  write(KEYS.mode, pref);
  applyMode(resolveMode(pref));
}

/**
 * Swaps the mode. With view transitions the browser cross-fades two snapshots of the page on the
 * GPU, so it costs the same on a long table as on an empty screen; without them, or with reduced
 * motion, it switches at once. Element transitions stay paused meanwhile (`.mode-switching`), so
 * no button or input fades on its own behind the cross-fade.
 */
let switches = 0;

function applyMode(mode: "light" | "dark") {
  const el = root();
  if (el.getAttribute("data-mode") === mode) return;
  const id = ++switches;
  const swap = () => {
    el.classList.add("mode-switching");
    el.setAttribute("data-mode", mode);
  };
  // A quick second toggle skips the first cross-fade; only the latest switch resumes transitions.
  const resume = () => {
    if (id === switches) el.classList.remove("mode-switching");
  };
  const reduced =
    el.getAttribute("data-motion") === "reduced" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !document.startViewTransition) {
    swap();
    requestAnimationFrame(() => requestAnimationFrame(resume));
    return;
  }
  const transition = document.startViewTransition(swap);
  transition.ready.catch(() => {}); // rejected when a newer switch skips this one: expected
  transition.finished.finally(resume);
}

export function getMotion(): Motion {
  return read(KEYS.motion) === "reduced" ? "reduced" : "full";
}
export function setMotion(m: Motion) {
  write(KEYS.motion, m);
  root().setAttribute("data-motion", m);
}

