"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Values a request depends on (ids, filters, page numbers). */
type Dep = string | number | boolean | null | undefined;

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Runs an async API call on mount and whenever `deps` change, with loading/error state and a
 * manual reload. While a new request is in flight the previous data stays on screen.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: readonly Dep[] = []): UseApiResult<T> {
  const [reloads, setReloads] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const requestKey = `${JSON.stringify(deps)}#${reloads}`;

  // The latest fetcher closes over the latest props; the request only re-runs when the key changes.
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef.current().then(
      (data) => {
        if (active) setSettled({ key: requestKey, data, error: null });
      },
      (err: unknown) => {
        const error = err instanceof Error ? err.message : "Algo salió mal. Inténtalo de nuevo.";
        if (active) setSettled((prev) => ({ key: requestKey, data: prev?.data ?? null, error }));
      },
    );
    return () => {
      active = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);

  return {
    data: settled?.data ?? null,
    loading: settled?.key !== requestKey,
    error: settled?.error ?? null,
    reload,
  };
}
