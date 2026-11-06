"use client";

import { Segmented } from "@/components/ui/Segmented";
import { TextField } from "@/components/ui/TextField";
import type { CardBrand, PaymentMethod } from "@/types/billing";
import { BRANDS, type PaymentErrors, type PaymentState } from "./payment";

interface PaymentFieldsProps {
  value: PaymentState;
  onChange: (v: PaymentState) => void;
  /** Errors to show now (after a send attempt). */
  errors: PaymentErrors;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Tarjeta" },
  { value: "yape", label: "Yape" },
  { value: "transferencia", label: "Transferencia" },
];

const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

/** Payment method and the few details the simulated checkout needs for it. */
export function PaymentFields({ value, onChange, errors }: PaymentFieldsProps) {
  const set = (patch: Partial<PaymentState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-text-secondary">Cómo pagas</span>
        <Segmented<PaymentMethod> label="Cómo pagas" value={value.method} options={METHODS} onChange={(method) => set({ method })} className="self-start" />
      </div>

      {value.method === "card" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-text-secondary">Marca</span>
            <Segmented<CardBrand> label="Marca de la tarjeta" value={value.brand} options={BRANDS} onChange={(brand) => set({ brand })} className="self-start" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <TextField
              label="Últimos 4 dígitos"
              inputMode="numeric"
              autoComplete="off"
              value={value.last4}
              onChange={(e) => set({ last4: digits(e.target.value, 4) })}
              error={errors.last4}
              className="[&_input]:font-mono"
            />
            <TextField
              label="Titular"
              autoComplete="off"
              value={value.holder}
              onChange={(e) => set({ holder: e.target.value.slice(0, 60) })}
              error={errors.holder}
              hint="Como figura en la tarjeta"
            />
          </div>
          <p className="text-[13px] text-text-muted">No pedimos el número completo ni el código de seguridad: este pago es una demostración.</p>
        </div>
      )}

      {value.method === "yape" && (
        <div className="flex flex-col gap-3">
          <TextField
            label="Código de aprobación de Yape"
            inputMode="numeric"
            autoComplete="off"
            value={value.yapeCode}
            onChange={(e) => set({ yapeCode: digits(e.target.value, 6) })}
            error={errors.yapeCode}
            hint="Los 6 dígitos que muestra Yape al aprobar un pago."
            className="max-w-xs [&_input]:font-mono [&_input]:tracking-[0.3em]"
          />
          <p className="text-[13px] text-text-muted">En esta demostración no hay una cuenta Yape real a la cual pagar: cualquier código de 6 dígitos sirve.</p>
        </div>
      )}

      {value.method === "transferencia" && (
        <p className="rounded-xl bg-surface-soft px-4 py-3 text-sm text-text-secondary">
          En esta demostración la transferencia se registra como pagada al confirmar. No hay una cuenta bancaria real a la cual transferir.
        </p>
      )}
    </div>
  );
}
