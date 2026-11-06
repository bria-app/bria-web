import Link from "next/link";
import { ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, soles } from "@/lib/format";
import { PAYMENT_LABEL, type PaymentMethod } from "@/types/pos";
import { HourBars } from "./HourBars";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";
import { CountUp } from "@/components/ui/CountUp";
import type { TodayCash } from "./todayCash";

const PAYMENT_SWATCH: Record<PaymentMethod, string> = {
  efectivo: "bg-success",
  yape: "bg-info",
  plin: "bg-info/55",
  tarjeta: "bg-text-secondary",
  transferencia: "bg-text-muted",
};

interface CajaWidgetProps {
  cash: TodayCash;
  /** Sales dated today that did not come from the till (imports, manual lines), from the ERP summary. */
  importedToday: number;
}

function Comparison({ total, before }: { total: number; before: number }) {
  const diff = Math.round(((total - before) / before) * 100);
  const up = diff >= 0;
  return (
    <span className={cn("text-[13px] font-semibold", up ? "text-success" : "text-danger")}>
      {up ? "▲" : "▼"} {formatNumber(Math.abs(diff))} % {up ? "más" : "menos"} que ayer a esta hora
    </span>
  );
}

/** Today's till: total, per hour against yesterday, and how people paid. */
export function CajaWidget({ cash, importedToday }: CajaWidgetProps) {
  const hasSales = cash.tickets > 0;
  // Comparing against yesterday only helps once there is something to compare.
  const yesterdayKnown = cash.complete && cash.hours.some((h) => h.yesterday > 0);
  const showYesterday = hasSales && yesterdayKnown;
  const note = cash.tickets === 1 ? "1 venta" : `${formatNumber(cash.tickets)} ventas`;

  return (
    <WidgetCard title="Caja de hoy" note={note} more={{ label: "Ver ventas", href: "/sales" }}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-[34px] font-medium leading-none tracking-[-0.02em] text-text-primary sm:text-[38px]">
            <CountUp value={cash.total} format={soles} />
          </span>
          {hasSales && cash.yesterdaySoFar != null && <Comparison total={cash.total} before={cash.yesterdaySoFar} />}
        </div>

        {!hasSales && yesterdayKnown ? (
          <div className="flex flex-1 flex-col justify-end gap-3">
            <p className="text-sm text-text-secondary">
              Aún no hay ventas hoy.{" "}
              <Link href="/sales/new" className="font-semibold text-accent-text hover:underline">
                Abre la caja
              </Link>
              {cash.yesterdaySoFar != null && cash.yesterdaySoFar > 0 && (
                <>
                  {" "}
                  · Ayer a esta hora llevabas <span className="font-mono text-text-primary">{soles(cash.yesterdaySoFar)}</span>.
                </>
              )}
            </p>
            <HourBars hours={cash.hours} showYesterday total={cash.total} />
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <span aria-hidden className="h-2 w-2 rounded-[2px] bg-border" /> Ayer, por hora
            </p>
          </div>
        ) : !hasSales ? (
          <WidgetEmpty icon={ScanBarcode}>
            <p className="font-semibold text-text-primary">Aún no hay ventas hoy</p>
            <p className="max-w-xs text-[13px]">Cada venta que cobres en la caja aparece aquí al momento, hora por hora.</p>
            <Link href="/sales/new" className="btn btn-secondary mt-1 h-9 px-3.5 text-[13px]">
              Abrir la caja
            </Link>
          </WidgetEmpty>
        ) : (
          <HourBars hours={cash.hours} showYesterday={showYesterday} total={cash.total} />
        )}

        {(cash.byPayment.length > 0 || showYesterday) && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Cómo te pagaron hoy">
            {cash.byPayment.map((p) => (
              <li key={p.method} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span aria-hidden className={cn("h-2 w-2 rounded-[2px]", PAYMENT_SWATCH[p.method] ?? "bg-border")} />
                {PAYMENT_LABEL[p.method] ?? p.method}
                <span className="font-mono text-text-primary">{soles(p.total)}</span>
              </li>
            ))}
            {showYesterday && (
              <li className="flex items-center gap-1.5 text-xs text-text-muted">
                <span aria-hidden className="h-2 w-2 rounded-[2px] bg-border" />
                Ayer, por hora
              </li>
            )}
          </ul>
        )}

        {importedToday > 0.5 && (
          <p className="text-xs text-text-muted">
            Además, <span className="font-mono">{soles(importedToday)}</span> en ventas cargadas fuera de la caja con fecha de hoy.
          </p>
        )}
      </div>
    </WidgetCard>
  );
}
