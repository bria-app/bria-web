"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Segmented } from "@/components/ui/Segmented";
import { TextField } from "@/components/ui/TextField";
import { ProductThumb } from "@/features/products/ProductThumb";
import { FieldShell } from "@/features/products/FormBits";
import { formatNumber, units } from "@/lib/format";
import { cn } from "@/lib/utils";
import { stockApi } from "@/services/api/inventory";
import { ADJUSTMENT_REASON_LABEL, type AdjustmentMode, type AdjustmentReason, type AdjustmentResult } from "@/types/inventory";

interface AdjustableProduct {
  id: string;
  name: string;
  sku: string;
  stock_on_hand: number;
  image_url?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  products: AdjustableProduct[];
  /** Fixes the product (e.g. from the product page). */
  productId?: string | null;
  onDone: (result: AdjustmentResult) => void;
}

const REASONS: { value: AdjustmentReason; hint: string }[] = [
  { value: "conteo", hint: "Contaste y no cuadra" },
  { value: "merma", hint: "Se dañó o rompió" },
  { value: "vencido", hint: "Pasó su fecha" },
  { value: "robo", hint: "Falta y no sabes por qué" },
  { value: "otro", hint: "Cualquier otra razón" },
];

/** The backend only lets these reasons take units out. */
const ONLY_REDUCES: AdjustmentReason[] = ["merma", "robo", "vencido"];

type Direction = "out" | "in";

/** «Ajustar inventario»: the only way the units on hand change by hand, always with a reason. */
export function StockAdjustmentModal({ open, onClose, companyId, products, productId, onDone }: Props) {
  const ids = useId();
  const [selected, setSelected] = useState("");
  const [mode, setMode] = useState<AdjustmentMode>("set");
  const [direction, setDirection] = useState<Direction>("out");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("conteo");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const [session, setSession] = useState({ open: false, productId: productId ?? null });
  if (session.open !== open || session.productId !== (productId ?? null)) {
    setSession({ open, productId: productId ?? null });
    if (open) {
      setSelected(productId ?? "");
      setMode("set");
      setDirection("out");
      setQuantity("");
      setReason("conteo");
      setNote("");
      setError(null);
      setTried(false);
    }
  }

  const product = products.find((p) => p.id === selected) ?? null;
  const options = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name, description: `${p.sku} · quedan ${units(p.stock_on_hand)}` })),
    [products],
  );

  const qty = quantity.trim() === "" ? null : Number(quantity);
  const validQty = qty !== null && Number.isInteger(qty) && qty >= 0;
  const current = product?.stock_on_hand ?? 0;
  const delta = !validQty ? null : mode === "set" ? qty - current : (direction === "out" ? -1 : 1) * qty;
  const next = delta === null ? null : current + delta;

  let problem: string | null = null;
  if (!product) problem = "Elige el producto.";
  else if (!validQty) problem = mode === "set" ? "Escribe cuántas unidades contaste (número entero)." : "Escribe cuántas unidades (número entero).";
  else if (delta === 0) problem = mode === "set" ? `Ya tienes ${formatNumber(current)}: no hay nada que ajustar.` : "Escribe al menos 1 unidad.";
  else if (next !== null && next < 0) problem = `No puede quedar en negativo: tienes ${formatNumber(current)}.`;
  else if (delta !== null && delta > 0 && ONLY_REDUCES.includes(reason)) problem = `«${ADJUSTMENT_REASON_LABEL[reason]}» solo puede restar.`;

  const pickReason = (r: AdjustmentReason) => {
    setReason(r);
    if (ONLY_REDUCES.includes(r)) {
      setMode("delta");
      setDirection("out");
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTried(true);
    if (!companyId || !product || problem || qty === null) return;
    setSaving(true);
    setError(null);
    try {
      const result = await stockApi.adjust(companyId, {
        product_id: product.id,
        mode,
        quantity: mode === "set" ? qty : (direction === "out" ? -1 : 1) * qty,
        reason,
        note: note.trim() || undefined,
      });
      onDone(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el ajuste.");
    } finally {
      setSaving(false);
    }
  };

  const onlyOut = ONLY_REDUCES.includes(reason);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar inventario"
      description="Queda registrado en las entradas y salidas del producto, con su motivo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="strong" onClick={() => submit()} loading={saving}>
            Guardar ajuste
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {productId && product ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-soft px-4 py-3">
            <ProductThumb src={product.image_url} name={product.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
              <p className="font-mono text-[12.5px] text-text-muted">{product.sku}</p>
            </div>
          </div>
        ) : (
          <FieldShell label="Producto">
            <Select aria-label="Producto" value={selected} options={options} onChange={setSelected} searchable placeholder="Busca por nombre o código" />
          </FieldShell>
        )}

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-text-secondary">¿Qué pasó?</legend>
          <div role="radiogroup" aria-label="Motivo" className="flex flex-wrap gap-2">
            {REASONS.map((r) => {
              const on = reason === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickReason(r.value)}
                  className={cn(
                    "flex min-h-11 flex-col items-start justify-center rounded-xl border px-3 py-1.5 text-left transition-colors",
                    on ? "border-strong bg-strong text-strong-foreground" : "border-border bg-surface text-text-primary hover:border-text-muted/50",
                  )}
                >
                  <span className="text-[13px] font-semibold">{ADJUSTMENT_REASON_LABEL[r.value]}</span>
                  <span className={cn("text-[11.5px]", on ? "opacity-75" : "text-text-muted")}>{r.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {onlyOut ? (
          <p className="text-[13px] text-text-muted">Con este motivo solo puedes restar unidades.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<AdjustmentMode>
              label="Cómo ajustar"
              value={mode}
              onChange={setMode}
              options={[{ value: "set", label: "Conté y hay…" }, { value: "delta", label: "Sumar o restar" }]}
            />
            {mode === "delta" && (
              <Segmented<Direction>
                label="Dirección"
                value={direction}
                onChange={setDirection}
                options={[{ value: "out", label: "Restar" }, { value: "in", label: "Sumar" }]}
              />
            )}
          </div>
        )}

        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
          <TextField
            label={mode === "set" ? "¿Cuántas unidades contaste?" : direction === "out" ? "¿Cuántas unidades restas?" : "¿Cuántas unidades sumas?"}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className="[&_input]:font-mono"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={tried && problem && product ? problem : null}
            autoFocus={!!productId}
          />
          <div className="flex h-12 items-center gap-3 rounded-xl bg-surface-soft px-4 font-mono text-[15px]" aria-live="polite">
            <span>
              <span className="sr-only">Ahora tienes </span>
              {product ? formatNumber(current) : "—"}
            </span>
            <ArrowRight aria-hidden className="h-4 w-4 text-text-muted" />
            <span className={cn(delta && delta < 0 ? "text-danger" : delta && delta > 0 ? "text-success" : "text-text-primary")}>
              <span className="sr-only">Quedarán </span>
              {next != null && product ? formatNumber(next) : "—"}
            </span>
          </div>
        </div>

        <TextField label="Nota" hint="Opcional. Ej. bolsa rota en el depósito." id={`${ids}-note`} value={note} maxLength={180} onChange={(e) => setNote(e.target.value)} />
        {tried && problem && !product && <p className="text-[12.5px] text-danger">{problem}</p>}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
