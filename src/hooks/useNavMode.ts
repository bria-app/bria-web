"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * How the person moves around: full sidebar, icon rail, or the floating dock ("counter mode").
 * A per-device preference (a cashier's tablet and the owner's laptop differ), so it lives in
 * localStorage. Narrow screens always use the dock.
 */
export type NavMode = "lateral" | "riel" | "dock";
/** The dock with a few shortcuts, or with every section of the sidebar. */
export type DockStyle = "simple" | "completo";

const KEY = "bria-nav";
const DOCK_KEY = "bria-dock";
const EVENT = "bria-nav-change";
const NARROW = "(max-width: 767px)";

function readMode(): NavMode {
  try {
    const value = localStorage.getItem(KEY);
    return value === "riel" || value === "dock" ? value : "lateral";
  } catch {
    return "lateral";
  }
}

function readDock(): DockStyle {
  try {
    return localStorage.getItem(DOCK_KEY) === "completo" ? "completo" : "simple";
  } catch {
    return "simple";
  }
}

function readNarrow(): boolean {
  return window.matchMedia(NARROW).matches;
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(NARROW);
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onChange);
  };
}

export function useNavMode() {
  const preferred = useSyncExternalStore(subscribe, readMode, () => "lateral" as NavMode);
  const narrow = useSyncExternalStore(subscribe, readNarrow, () => false);
  const preferredDock = useSyncExternalStore(subscribe, readDock, () => "simple" as DockStyle);

  const setMode = useCallback((mode: NavMode) => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* storage blocked: the change still applies until reload */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const setDockStyle = useCallback((style: DockStyle) => {
    try {
      localStorage.setItem(DOCK_KEY, style);
    } catch {
      /* storage blocked: the change still applies until reload */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    mode: narrow ? ("dock" as NavMode) : preferred,
    preferred,
    narrow,
    setMode,
    // A phone cannot fit every section at a tappable size: there the dock is always the simple one.
    dockStyle: narrow ? ("simple" as DockStyle) : preferredDock,
    preferredDock,
    setDockStyle,
  };
}
