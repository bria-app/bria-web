"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatNumber, soles } from "@/lib/format";
import type { Totals } from "./lines";

interface Props {
  totals: Totals;
  error: string | null;
  saving: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

/** Sticky footer: totals, what happens on save, and the one primary action. */
export function PurchaseSubmitBar({ totals, error, saving, disabled, onSubmit }: Props) {
  return (
    <div className="sticky bottom-[calc(var(--dock-clear,0px)+1rem)] z-10 space-y-3">
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-soft-xl lg:flex-row lg:items-center lg:justify-between">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Item label="Unidades" value={formatNumber(totals.units)} />
          <Item label="Subtotal sin IGV" value={soles(totals.subtotal)} />
          <Item label="IGV 18 %" value={soles(totals.igv)} />
          <div className="flex items-baseline gap-2">
            <dt className="font-semibold text-text-primary">Total</dt>
            <dd className="font-mono text-xl font-semibold text-text-primary">{soles(totals.total)}</dd>
          </div>
        </dl>
        <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <p className="hidden text-[12.5px] text-text-muted sm:block sm:max-w-[260px] sm:text-right">
            Al registrarla, tu inventario sube de inmediato y se actualiza el costo promedio.
          </p>
          <Button size="lg" onClick={onSubmit} loading={saving} disabled={disabled}>
            {saving ? "Registrando…" : `Registrar compra · ${soles(totals.total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-mono text-text-secondary">{value}</dd>
    </div>
  );
}
