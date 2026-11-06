"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ACTIONS, confidenceText, decide } from "@/features/forecasting/decisions";
import { useApi } from "@/hooks/useApi";
import { ftgmApi } from "@/services/api/forecasting";
import { shortDate } from "@/lib/format";

/**
 * What bria suggests for this product, from the newest successful forecast that included
 * it. Renders nothing when there is no such forecast: no estimate is ever made up here.
 */
export function ProductForecastCard({ companyId, productId }: { companyId: string | null; productId: string }) {
  const advice = useApi(async () => {
    if (!companyId) return null;
    const run = (await ftgmApi.byProduct(companyId, productId, 1))[0]?.run;
    if (!run || run.status !== "success") return null;
    const row = (await ftgmApi.overview(companyId, run.id)).products.find((p) => p.product_id === productId);
    return row && row.status !== "skipped" ? { run, row } : null;
  }, [companyId, productId]);

  const data = advice.data;
  if (!data) return null;
  const d = decide(data.row);
  const meta = ACTIONS[d.action];
  const simulated = data.run.ftgm_engine_mode === "mock";
  const when = data.run.completed_at ?? data.run.created_at;

  return (
    <section aria-label="Sugerencia de bria" className="space-y-3 rounded-2xl border border-accent-line/40 bg-primary-soft p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-accent-text">Sugerencia de bria</span>
        <Badge tone={meta.tone}>{meta.title}</Badge>
        {simulated && <Badge tone="warning">Pronóstico simulado</Badge>}
      </div>
      <p className="text-[15px] leading-relaxed text-text-primary">{d.sentence}</p>
      <p className="text-[12.5px] text-text-muted">
        Vendes {d.rate} · {confidenceText(d.confidence)}
        {when ? ` · Pronóstico del ${shortDate(when)}` : ""}
        {simulated ? " · El motor de pronóstico estaba en modo de prueba: no uses esta cifra para comprar." : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/forecasting/${data.run.id}`} className="btn btn-secondary h-10 px-4 text-sm">
          Ver el pronóstico
        </Link>
      </div>
    </section>
  );
}
