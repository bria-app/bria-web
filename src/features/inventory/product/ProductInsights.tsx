import Link from "next/link";
import { CalendarDays, Minus, PackageX, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight, InsightTone } from "./salesInsights";

const ICON: Record<InsightTone, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
  alert: PackageX,
  calm: ShieldCheck,
  info: CalendarDays,
};

const ICON_TONE: Record<InsightTone, string> = {
  up: "bg-success-soft text-success",
  down: "bg-warning-soft text-warning",
  flat: "bg-surface-muted text-text-secondary",
  alert: "bg-danger-soft text-danger",
  calm: "bg-success-soft text-success",
  info: "bg-surface-muted text-text-secondary",
};

/** «Cómo va»: what the real sales say before any forecast, and the way to forecast it. */
export function ProductInsights({ productId, insights }: { productId: string; insights: Insight[] }) {
  return (
    <section aria-label="Cómo va este producto" className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">Cómo va</h2>
          <p className="text-[12.5px] text-text-muted">Leído de tus ventas reales. Todavía no es un pronóstico.</p>
        </div>
        <Link href={`/forecasting?product=${productId}`} className="btn btn-strong h-10 gap-2 px-4 text-sm">
          <Sparkles aria-hidden className="h-4 w-4" /> Pronosticar este producto
        </Link>
      </div>
      {insights.length ? (
        <ul className="grid gap-x-6 gap-y-4 md:grid-cols-2">
          {insights.map((i) => {
            const Icon = ICON[i.tone];
            return (
              <li key={i.id} className="flex gap-3">
                <span aria-hidden className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", ICON_TONE[i.tone])}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary">{i.title}</p>
                  <p className="text-[13px] leading-relaxed text-text-secondary">{i.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">Aún hay pocas ventas para sacar conclusiones. Vuelve cuando tenga unos meses de historia.</p>
      )}
    </section>
  );
}
