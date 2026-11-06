"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    media.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

const read = () => window.matchMedia(QUERY).matches || document.documentElement.dataset.motion === "reduced";

/** True when the OS asks for less motion or the person chose «Reducidas» in Configuración. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
