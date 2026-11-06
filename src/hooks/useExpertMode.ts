"use client";

import { useSyncExternalStore } from "react";

/**
 * "Modo experto": the ERP is built for MYPE owners with no technical background, so every
 * screen shows the simple version by default. Technical detail (model metrics, raw codes,
 * diagnostics) only appears when this per-browser switch is on (Configuración → Modo experto).
 */
const KEY = "dss-expert-mode";
const EVENT = "dss-expert-mode-change";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setExpertMode(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode: the switch only lasts until the page reloads */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useExpertMode(): [boolean, (on: boolean) => void] {
  return [useSyncExternalStore(subscribe, read, () => false), setExpertMode];
}
