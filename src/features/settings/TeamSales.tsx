"use client";

import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { Segmented } from "@/components/ui/Segmented";
import { presetRange } from "@/features/pos/dates";
import { useApi } from "@/hooks/useApi";
import { formatNumber, percent, soles } from "@/lib/format";
import { posApi } from "@/services/api/pos";
import { SettingsBlock } from "./SettingsBlock";

type Period = "month" | "30d" | "all";

/** «Cómo vende tu equipo»: each person's share of what the store sold, from real tickets. */
export function TeamSales({ companyId, canOpen, onOpen }: { companyId: string; canOpen: (userId: string) => boolean; onOpen: (userId: string) => void }) {
  const [period, setPeriod] = useState<Period>("month");
  const range = presetRange(period);
  const summary = useApi(() => posApi.summary(companyId, { date_from: range.from, date_to: range.to }), [companyId, period]);
  const s = summary.data;
  const rows = [...(s?.by_seller ?? [])].sort((a, b) => Number(b.total) - Number(a.total));
  const top = Math.max(1, ...rows.map((r) => Number(r.total)));
  const total = Number(s?.revenue ?? 0);

  return (
    <SettingsBlock
      title="Cómo vende tu equipo"
      hint="Cuánto cobró cada persona en la caja. Toca a alguien para ver su ficha."
      action={
        <Segmented<Period>
          label="Período"
          size="sm"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "month", label: "Este mes" },
            { value: "30d", label: "30 días" },
            { value: "all", label: "Todo" },
          ]}
        />
      }
    >
      <DataState loading={summary.loading && !s} error={summary.error} onRetry={summary.reload}>
        {rows.length === 0 ? (
          <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">Nadie cobró ventas en este período.</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((r) => {
              const value = Number(r.total);
              const body = (
                <>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px] font-semibold text-text-primary">{r.seller_name || "Sin nombre"}</span>
                    <span className="shrink-0 font-mono text-[13px] text-text-primary">{soles(value)}</span>
                  </span>
                  <span aria-hidden className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(value / top) * 100}%` }} />
                  </span>
                  <span className="mt-1 block text-[12px] text-text-muted">
                    {formatNumber(r.orders)} {r.orders === 1 ? "venta" : "ventas"} · {formatNumber(r.units)} u
                    {total > 0 ? ` · ${percent(value / total)} de la tienda` : ""}
                    {r.orders > 0 ? ` · ticket promedio ${soles(value / r.orders)}` : ""}
                  </span>
                </>
              );
              return (
                <li key={r.seller_id ?? r.seller_name}>
                  {r.seller_id && canOpen(r.seller_id) ? (
                    <button type="button" onClick={() => onOpen(r.seller_id!)} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-surface-soft">
                      {body}
                    </button>
                  ) : (
                    <div className="px-3 py-2.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DataState>
    </SettingsBlock>
  );
}
