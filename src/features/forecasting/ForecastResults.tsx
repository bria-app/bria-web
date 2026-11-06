"use client";

import { useMemo, useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import type { ForecastResultDTO } from "@/types/api";
import type { FtgmQuota, FtgmRun, RunOverview } from "@/types/forecasting";
import { AccuracyTab } from "./accuracy/AccuracyTab";
import { BuyTab } from "./BuyTab";
import { DemoModeNotice, isDemoOverview, useEngineMode } from "./DemoModeBanner";
import { ProductForecastModal } from "./ProductForecastModal";
import { ResultSummary } from "./ResultSummary";
import { SalesForecastTab } from "./SalesForecastTab";
import { isToBuy, urgencyRank } from "./decisions";
import type { HorizonSeries } from "./horizon/series";

export type ResultTab = "pron" | "comprar" | "acierto";
const TABS: ResultTab[] = ["pron", "comprar", "acierto"];

/**
 * A finished run: the answer first (summary), then «Cuánto venderás», «Qué comprar» and «Qué tan
 * bien acierta» (the test against the past), plus the per-product detail.
 */
export function ForecastResults({
  companyId,
  run,
  tab,
  onTab,
  expert,
  backtests,
  quota,
  onBacktest,
  overview: ov,
  results,
  series,
  onReload,
}: {
  companyId: string;
  run: FtgmRun;
  overview: RunOverview;
  results: ForecastResultDTO[];
  series: HorizonSeries | null;
  onReload: () => void;
  tab: ResultTab;
  onTab: (tab: ResultTab) => void;
  expert: boolean;
  backtests: FtgmRun[];
  quota: FtgmQuota | null;
  onBacktest: () => void;
}) {
  const engineMode = useEngineMode();
  const [openId, setOpenId] = useState<string | null>(null);

  const products = ov.products;
  const resultOf = useMemo(() => new Map(results.map((r) => [r.product_id, r])), [results]);
  const rows = useMemo(
    () =>
      [...products].sort((a, b) => urgencyRank(a) - urgencyRank(b)).map((p) => ({
        product: p,
        periods: ov.diagnostics[p.product_id]?.n_periods ?? resultOf.get(p.product_id)?.history.length ?? 0,
      })),
    [products, ov, resultOf],
  );
  const toBuy = products.filter(isToBuy).length;
  const openAt = rows.findIndex((r) => r.product.product_id === openId);
  const open = openAt >= 0 ? rows[openAt] : null;

  return (
    <div className="tab-stage space-y-5">
          {/* The page banner covers a server on the demo engine; this one, a demo run opened later. */}
          {isDemoOverview(ov) && engineMode !== "mock" && <DemoModeNotice />}

          <ResultSummary overview={ov} products={products} series={series} onTab={onTab} />

          <Tabs
            value={tab}
            onChange={(id) => onTab(TABS.find((t) => t === id) ?? "pron")}
            tabs={[
              { id: "pron", label: "Cuánto venderás" },
              { id: "comprar", label: "Qué comprar", count: toBuy },
              { id: "acierto", label: "Qué tan bien acierta" },
            ]}
          />

          {tab === "acierto" ? (
            <AccuracyTab companyId={companyId} run={run} backtests={backtests} quota={quota} onCreated={onBacktest} />
          ) : tab === "pron" ? (
            <SalesForecastTab
              products={products}
              rows={rows}
              results={results}
              horizonDays={run.horizon_days}
              accuracy={ov.summary.accuracy_pct}
              excluded={ov.preview?.excluded ?? []}
              expert={expert}
              onOpen={setOpenId}
            />
          ) : (
            <BuyTab key={run.id} companyId={companyId} products={products} expert={expert} onReload={onReload} />
          )}

          <ProductForecastModal
            companyId={companyId}
            runId={run.id}
            horizonDays={run.horizon_days}
            product={open?.product ?? null}
            periods={open?.periods ?? 0}
            result={openId ? resultOf.get(openId) : undefined}
            diag={openId ? ov.diagnostics[openId] : undefined}
            expert={expert}
            onClose={() => setOpenId(null)}
            position={openAt >= 0 ? { at: openAt, of: rows.length } : null}
            onStep={(by) => setOpenId(rows[(openAt + by + rows.length) % rows.length].product.product_id)}
          />
    </div>
  );
}
