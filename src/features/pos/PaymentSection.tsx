"use client";

import { soles } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAYMENT_LABEL, type PaymentMethod } from "@/types/pos";
import { moneyInput, toNumber } from "./cart";
import { TouchChoice } from "./TouchChoice";

const METHODS = Object.keys(PAYMENT_LABEL) as PaymentMethod[];

interface PaymentSectionProps {
  method: PaymentMethod;
  onMethod: (method: PaymentMethod) => void;
  received: string;
  onReceived: (value: string) => void;
  total: number;
}

/** One payment method per sale (the backend has no split payments). Change only for cash. */
export function PaymentSection({ method, onMethod, received, onReceived, total }: PaymentSectionProps) {
  const amount = toNumber(received);
  const bills = Array.from(new Set([10, 50, 100].map((m) => Math.ceil(total / m) * m)))
    .filter((v) => v > total)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-2.5">
      <div role="radiogroup" aria-label="Forma de pago" className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-1.5">
        {METHODS.map((m) => (
          <TouchChoice key={m} active={method === m} onClick={() => onMethod(m)} className="px-2">
            {PAYMENT_LABEL[m]}
          </TouchChoice>
        ))}
      </div>

      {method === "efectivo" && total > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <label
            className={cn(
              "flex h-11 w-[150px] items-center gap-2 rounded-xl border bg-surface px-3 focus-within:ring-4",
              received !== "" && amount < total
                ? "border-danger focus-within:ring-danger/15"
                : "border-border focus-within:border-accent-text focus-within:ring-primary/20",
            )}
          >
            <span className="text-[12.5px] text-text-muted">Recibe</span>
            <input
              value={received}
              onChange={(e) => onReceived(moneyInput(e.target.value))}
              inputMode="decimal"
              placeholder="exacto"
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-[14px] text-text-primary outline-none placeholder:font-sans placeholder:text-text-muted"
            />
          </label>
          {bills.map((v) => (
            <TouchChoice key={v} role="toggle" mono active={amount === v} onClick={() => onReceived(v.toFixed(2))}>
              {soles(v)}
            </TouchChoice>
          ))}
          <p
            aria-live="polite"
            className={cn("ml-auto text-[14px] font-semibold", received !== "" && amount < total ? "text-danger" : "text-success")}
          >
            {received === "" ? "" : amount < total ? `Faltan ${soles(total - amount)}` : `Vuelto ${soles(amount - total)}`}
          </p>
        </div>
      )}
    </div>
  );
}
