"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "bria-pref-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * A per-device choice kept in localStorage (a till tablet and the owner's laptop differ).
 * Only values in `allowed` are read back; anything else falls back to `fallback`.
 */
export function useDevicePref<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (value: T) => void] {
  const read = useCallback((): T => {
    try {
      const v = window.localStorage.getItem(key);
      return allowed.includes(v as T) ? (v as T) : fallback;
    } catch {
      return fallback;
    }
  }, [key, allowed, fallback]);
  const value = useSyncExternalStore(subscribe, read, () => fallback);

  const set = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, next);
      } catch {
        /* storage blocked: the choice lasts until reload */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}

export type DockSide = "abajo" | "izquierda";
export type SectionMotion = "subir" | "deslizar";
/** How one list reads: a table or cards. Which way the page runs is a separate choice (`PageFlow`). */
export type ListView = "tabla" | "tarjetas";
/** The lists that can be read either way; each one remembers its own choice. */
export type ListViewScreen = "inventario" | "proveedores" | "ventas" | "compras";
export type PageFlow = "abajo" | "lado";

const SIDES = ["abajo", "izquierda"] as const;
const MOTIONS = ["subir", "deslizar"] as const;
const FLOWS = ["abajo", "lado"] as const;
const VIEWS = ["tabla", "tarjetas"] as const;

/** Where the dock sits: along the bottom or as a column on the left edge. */
export const useDockSide = () => useDevicePref<DockSide>("bria-dock-side", SIDES, "abajo");
/** How a new section arrives: rising in place, or sliding in from the side (with swipe between sections). */
export const useSectionMotion = () => useDevicePref<SectionMotion>("bria-section-motion", MOTIONS, "subir");
/** Table or cards, for one list only: changing it in Ventas leaves Compras as it was. */
export const useListView = (screen: ListViewScreen) => useDevicePref<ListView>(`bria-view-${screen}`, VIEWS, "tabla");
/** Which way every screen runs: scrolling down (the usual), or on to the right as one strip of columns. */
export const usePageFlow = () => useDevicePref<PageFlow>("bria-page-flow", FLOWS, "abajo");
