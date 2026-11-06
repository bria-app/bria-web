"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { suppliersApi } from "@/services/api/resources";
import { formatNumber } from "@/lib/format";
import type { SupplierDTO } from "@/types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  supplier: SupplierDTO;
  purchases: number;
  onDeleted: () => void;
}

/** Deleting cannot be undone, so it asks first and points to «Inactivo» as the softer option. */
export function DeleteSupplierDialog({ open, onClose, companyId, supplier, purchases, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!companyId) return;
    setDeleting(true);
    setError(null);
    try {
      await suppliersApi.remove(companyId, supplier.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el proveedor.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`¿Eliminar a «${supplier.business_name}»?`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting} data-autofocus>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} loading={deleting}>
            Eliminar proveedor
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <p>Se borra su ficha y no se puede deshacer.</p>
        {purchases > 0 && (
          <p>
            Sus <span className="font-mono">{formatNumber(purchases)}</span> {purchases === 1 ? "compra se queda" : "compras se quedan"} en tu historial y tu inventario
            no cambia, pero aparecerán como «Proveedor eliminado».
          </p>
        )}
        <p>Si solo dejaste de comprarle, mejor márcalo como inactivo en su ficha.</p>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
