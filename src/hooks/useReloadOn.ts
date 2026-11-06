"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `reload` when the window event `name` fires (e.g. `NOTIFICATIONS_CHANGED`), so two
 * places with their own `useApi` stay in step. A burst of events (marking 20 notices one by
 * one) gives a single reload, `delayMs` after the last one.
 */
export function useReloadOn(name: string, reload: () => void, delayMs = 300): void {
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEvent = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reloadRef.current(), delayMs);
    };
    window.addEventListener(name, onEvent);
    return () => {
      window.removeEventListener(name, onEvent);
      clearTimeout(timer);
    };
  }, [name, delayMs]);
}
