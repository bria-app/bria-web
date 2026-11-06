"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { readStatus } from "@/services/api/health";
import type { FtgmRun, ProductDiagnostics, RunOverview } from "@/types/forecasting";

/**
 * Demo mode. When the API runs the simulated engine (`FTGM_ENGINE_MODE=mock`)
 * every figure on the forecast screens is made up, so they must say it, always and
 * visibly. Several shapes are accepted on purpose, because the API exposes the mode in more
 * than one place (and older deployments in none):
 *
 * - `/health` or `/status`: `ftgm_engine_mode` at the top level or under `dependencies`;
 * - a run, its summary or a product's diagnostics: `ftgm_engine_mode` / `engine` = "mock";
 * - a model name of "DEMO" (run `model_name`, product `model_used`, diagnostics `model`).
 */
const isMock = (v: unknown) => typeof v === "string" && v.trim().toLowerCase() === "mock";
const isDemoModel = (v: unknown) => typeof v === "string" && v.trim().toUpperCase() === "DEMO";

function isDemoDiagnostics(d: ProductDiagnostics | null | undefined): boolean {
  if (!d) return false;
  return isMock(d.engine) || isMock(d.ftgm_engine_mode) || isDemoModel(d.model);
}

function isDemoRun(run: FtgmRun | null | undefined): boolean {
  if (!run) return false;
  const s = run.summary;
  return (
    isMock(run.ftgm_engine_mode) ||
    isDemoModel(run.model_name) ||
    isMock(s?.ftgm_engine_mode) ||
    isMock(s?.engine) ||
    Object.keys(s?.models ?? {}).some(isDemoModel)
  );
}

export function isDemoOverview(ov: RunOverview | null | undefined): boolean {
  if (!ov) return false;
  return (
    isDemoRun(ov.run) ||
    ov.products.some((p) => isDemoModel(p.model_used)) ||
    Object.values(ov.diagnostics ?? {}).some(isDemoDiagnostics)
  );
}

type EngineMode = "mock" | "real" | null;

function modeFrom(body: unknown): EngineMode {
  if (!body || typeof body !== "object") return null;
  const b = body as { ftgm_engine_mode?: unknown; dependencies?: { ftgm_engine_mode?: unknown } };
  const raw = b.ftgm_engine_mode ?? b.dependencies?.ftgm_engine_mode;
  if (typeof raw !== "string") return null;
  return isMock(raw) ? "mock" : "real";
}

/** One lookup per page load, shared by every banner on screen. */
let modePromise: Promise<EngineMode> | null = null;

function loadEngineMode(): Promise<EngineMode> {
  if (!modePromise) {
    modePromise = (async () => modeFrom(await readStatus("/health")) ?? modeFrom(await readStatus("/status")))();
  }
  return modePromise;
}

/** The API's engine mode ("mock" | "real"), or null while unknown / not reported. */
export function useEngineMode(): EngineMode {
  const [mode, setMode] = useState<EngineMode>(null);
  useEffect(() => {
    let alive = true;
    void loadEngineMode().then((m) => {
      if (alive) setMode(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return mode;
}

/** Fixed, non-dismissable notice, shown while the API says it runs the demo engine. */
export function DemoModeBanner() {
  const mode = useEngineMode();
  return mode === "mock" ? <DemoModeNotice /> : null;
}

/** The notice itself, also shown on a run the demo engine produced. */
export function DemoModeNotice() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-warning">Modo demostración: estas cifras son simuladas</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Las genera un motor de prueba, no el pronóstico real. No las uses para decidir compras ni como prueba de
          que el pronóstico acierta.
        </p>
      </div>
    </div>
  );
}
