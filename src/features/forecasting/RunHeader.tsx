"use client";

import { Select } from "@/components/ui/Select";
import { timeAgo } from "@/lib/format";
import type { FtgmRun } from "@/types/forecasting";
import { dateLabel, forWhen, frequencyLabel } from "./labels";

/** Which run is on screen, and a way to open an earlier one (opening one never uses the monthly quota). */
export function RunHeader({
  run,
  runs,
  onPick,
  expert,
}: {
  run: FtgmRun;
  /** Earlier finished runs, newest first. */
  runs: FtgmRun[];
  onPick: (runId: string) => void;
  expert: boolean;
}) {
  const at = run.completed_at ?? run.created_at;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{run.scope_description ?? "Pronóstico"}</span> · {forWhen(run.horizon_days)} ·{" "}
        {run.product_count} {run.product_count === 1 ? "producto" : "productos"}
        {at && ` · calculado ${timeAgo(at)}`}
        {expert && run.frequency && ` · frecuencia ${(frequencyLabel[run.frequency] ?? run.frequency).toLowerCase()}`}
        {expert && run.as_of && ` · historia hasta el ${dateLabel(run.as_of)}`}
      </p>
      {runs.length > 1 && (
        <div className="w-72 max-w-full">
          <Select
            size="sm"
            aria-label="Ver otro cálculo"
            value={run.id}
            onChange={onPick}
            options={runs.map((r) => ({
              value: r.id,
              label: `${dateLabel(r.completed_at ?? r.created_at)} · ${r.scope_description ?? "Pronóstico"}`,
              description: `${forWhen(r.horizon_days)} · ${r.product_count} ${r.product_count === 1 ? "producto" : "productos"}`,
            }))}
          />
        </div>
      )}
    </div>
  );
}
