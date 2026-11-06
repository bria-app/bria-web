"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatNumber, timeAgo } from "@/lib/format";
import type { FtgmQuota, PreviewTotals } from "@/types/forecasting";
import { InlineChoice, type ChoiceOption } from "./InlineChoice";

const HORIZONS: ChoiceOption[] = [
  { value: "30", label: "El próximo mes", phrase: "el próximo mes", group: "Para comprar" },
  { value: "60", label: "Los próximos 2 meses", phrase: "los próximos 2 meses", group: "Para comprar" },
  { value: "90", label: "Los próximos 3 meses", phrase: "los próximos 3 meses", group: "Para comprar" },
  { value: "180", label: "Los próximos 6 meses", phrase: "los próximos 6 meses", group: "Para planificar" },
  { value: "365", label: "El próximo año", phrase: "el próximo año", group: "Para planificar" },
  { value: "730", label: "Los próximos 2 años", phrase: "los próximos 2 años", group: "Para planificar" },
];
export const HORIZON_VALUES = HORIZONS.map((h) => h.value);
/** From here on the forecast is a reference for planning, not for this month's order. */
export const LONG_HORIZON_DAYS = 365;

export interface ForecastConfigProps {
  scopeOptions: ChoiceOption[];
  scope: string;
  onScope: (value: string) => void;
  horizon: string;
  onHorizon: (value: string) => void;
  onCalculate: () => void;
  calculating: boolean;
  /** Launching the run (the request itself). */
  starting: boolean;
  preview: { loading: boolean; totals: PreviewTotals | null; error: string | null };
  quota: FtgmQuota | null;
  lastRunAt: string | null;
}

/** «Predice [alcance] para [horizonte]» + «Calcular», with what the choice covers and the plan's limit. The stage is its frame. */
export function ForecastConfig(props: ForecastConfigProps) {
  const { preview, quota, calculating } = props;
  const outOfQuota = quota?.remaining === 0;
  const nothingToForecast = !preview.loading && preview.totals != null && preview.totals.products_included === 0;
  const blocked = calculating || props.starting || outOfQuota || nothingToForecast || preview.loading;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {/* A div, not a <p>: the inline choices open a listbox (a block) inside the sentence. */}
        <div className="min-w-0 flex-[1_1_380px] font-display text-[19px] font-semibold leading-[1.6] tracking-[-0.015em] text-text-primary sm:text-[22px]">
          Predice{" "}
          <InlineChoice label="Qué predecir" value={props.scope} options={props.scopeOptions} onChange={props.onScope} disabled={calculating} />{" "}
          para{" "}
          <InlineChoice label="Para cuánto tiempo" value={props.horizon} options={HORIZONS} onChange={props.onHorizon} disabled={calculating} />
        </div>
        <Button size="lg" onClick={props.onCalculate} disabled={blocked} loading={props.starting}>
          {!props.starting && <Sparkles aria-hidden className="h-[18px] w-[18px]" />}
          {calculating ? "Calculando…" : "Calcular"}
        </Button>
      </div>

      <div className="space-y-2 text-[13px]">
        <CoverageLine preview={preview} lastRunAt={props.lastRunAt} />
        {Number(props.horizon) >= LONG_HORIZON_DAYS && (
          <p className="rounded-xl bg-primary-soft/70 px-4 py-2.5 text-text-secondary">
            <span className="font-semibold text-text-primary">A un año o más, tómalo como referencia.</span> bria. elige el método con lo que acierta
            a pocos meses; a dos años, una tendencia de hoy puede no seguir. Para comprar, mira los próximos 1 a 3 meses y vuelve a calcular cada mes.
          </p>
        )}
        {quota?.monthly_limit != null && (
          <p className="text-text-secondary">
            {outOfQuota
              ? `Usaste tus ${quota.monthly_limit} predicciones gratis de este mes. Abrir las anteriores no gasta nada.`
              : `Plan Gratis: te quedan ${quota.remaining} de ${quota.monthly_limit} predicciones este mes.`}{" "}
            <Link href="/premium" className="font-semibold text-accent-text hover:underline">
              {outOfQuota ? "Calcula sin límite con Premium" : "Ver Premium"}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function CoverageLine({ preview, lastRunAt }: { preview: ForecastConfigProps["preview"]; lastRunAt: string | null }) {
  const last = lastRunAt ? `último cálculo ${timeAgo(lastRunAt)}` : "todavía sin calcular";
  if (preview.loading) return <p className="text-text-muted">Revisando tus ventas…</p>;
  if (preview.error) return <p className="text-danger">{preview.error}</p>;
  const t = preview.totals;
  if (!t) return null;
  if (t.products_total === 0) return <p className="text-text-secondary">No hay productos activos en este grupo.</p>;
  if (t.products_included === 0) {
    return (
      <p className="text-text-secondary">
        Ninguno de estos productos tiene ventas suficientes todavía.{" "}
        <Link href="/sales?tab=imported" className="font-semibold text-accent-text hover:underline">
          Sube tus ventas pasadas
        </Link>
      </p>
    );
  }
  // What the forecast will learn from.
  const strong = "font-semibold text-text-secondary";
  return (
    <p className="text-text-muted">
      <span className={strong}>
        {formatNumber(t.products_included)} de {formatNumber(t.products_total)}
      </span>{" "}
      {t.products_total === 1 ? "producto" : "productos"} con ventas suficientes · <span className={strong}>{formatNumber(t.total_units)}</span> unidades para aprender
      {t.date_start && (
        <>
          {" "}
          · historia desde <span className={strong}>{monthYear(t.date_start)}</span>
        </>
      )}{" "}
      · {last}
      {t.products_excluded > 0 && ". Los demás se quedan fuera hasta que vendan más."}
    </p>
  );
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const monthYear = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
