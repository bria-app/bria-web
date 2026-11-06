"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { posApi } from "@/services/api/pos";
import { soles, units } from "@/lib/format";
import type { SalesOrder } from "@/types/pos";
import { tookNoStock } from "./orderOrigin";

const REASONS = ["Error al cobrar", "El cliente devolvió", "Otro motivo"] as const;
type Reason = (typeof REASONS)[number];

interface VoidOrderModalProps {
  open: boolean;
  order: SalesOrder;
  companyId: string;
  onClose: () => void;
  onVoided: (order: SalesOrder) => void;
}

/**
 * POST /sales-orders/{id}/void (owner/admin). Returns the units the sale took out and voids the linked
 * comprobante. Imported history never took stock, so nothing comes back for it.
 */
export function VoidOrderModal({ open, order, companyId, onClose, onVoided }: VoidOrderModalProps) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = reason === "Otro motivo" ? detail.trim() : [reason, detail.trim()].filter(Boolean).join(": ");
  const missing = !reason ? "Elige el motivo." : reason === "Otro motivo" && !detail.trim() ? "Cuenta brevemente el motivo." : null;

  const close = () => {
    if (saving) return;
    setReason(null);
    setDetail("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (missing) return setError(missing);
    setSaving(true);
    setError(null);
    try {
      onVoided(await posApi.void(companyId, order.id, text));
      setReason(null);
      setDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos anular la venta. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Anular ${order.document_number}`}
      description="Anular no se puede deshacer."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            No anular
          </Button>
          <Button variant="danger" onClick={() => void submit()} loading={saving}>
            Anular venta
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-[14px] text-text-secondary">
        <div className="flex gap-3 rounded-xl bg-danger-soft p-3.5 text-danger">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="flex flex-col gap-1">
            <li>{tookNoStock(order) ? "Es historial importado: tu inventario no cambia." : `Vuelven ${units(order.units)} al inventario.`}</li>
            <li>Deja de sumar {soles(order.total)} en tus ventas.</li>
            {order.invoice_id && (
              <li>
                El comprobante queda anulado en bria. Si ya lo informaste a SUNAT, comunica la baja o emite la nota de crédito
                con tu proveedor de facturación.
              </li>
            )}
          </ul>
        </div>
        <div role="group" aria-labelledby="void-reason" className="flex flex-col gap-1.5">
          <span id="void-reason" className="text-[13px] font-semibold text-text-secondary">
            Motivo
          </span>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <Chip
                key={r}
                active={reason === r}
                onClick={() => {
                  setReason(r);
                  setError(null);
                }}
              >
                {r}
              </Chip>
            ))}
          </div>
        </div>
        <TextField
          label="Detalle"
          hint={reason === "Otro motivo" ? undefined : "Opcional"}
          value={detail}
          maxLength={200}
          onChange={(e) => setDetail(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
