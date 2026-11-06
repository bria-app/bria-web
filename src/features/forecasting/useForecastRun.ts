"use client";

import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { ftgmApi } from "@/services/api/forecasting";
import type { FtgmRun } from "@/types/forecasting";

const POLL_MS = 1500;

export const isRunActive = (run: FtgmRun | null | undefined) => run?.status === "pending" || run?.status === "running";

/**
 * One forecast run, polled while the engine works on it. `onSettled` fires once when a run
 * this hook watched finishes (success, failure or cancellation).
 */
export function useForecastRun(companyId: string | null, runId: string | null, onSettled: (run: FtgmRun) => void) {
  const fetched = useApi(
    () => (companyId && runId ? ftgmApi.getRun(companyId, runId) : Promise.resolve(null)),
    [companyId, runId],
  );
  const [live, setLive] = useState<FtgmRun | null>(null);
  // Either may still hold the previous run for a moment after `runId` changes.
  const run = live?.id === runId ? live : fetched.data?.id === runId ? fetched.data : null;
  const active = isRunActive(run);

  const settled = useRef(onSettled);
  const settledId = useRef<string | null>(null);
  useEffect(() => {
    settled.current = onSettled;
  });

  useEffect(() => {
    if (!active || !companyId || !runId) return;
    const timer = window.setInterval(() => {
      ftgmApi
        .getRun(companyId, runId)
        .then((next) => {
          setLive(next);
          if (isRunActive(next) || settledId.current === next.id) return;
          settledId.current = next.id;
          settled.current(next);
        })
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [active, companyId, runId]);

  return { run, loading: !!runId && !run && !fetched.error, error: fetched.error, reload: fetched.reload };
}
