"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useApi } from "@/hooks/useApi";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import { SupplierCreateForm } from "./SupplierCreateForm";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  /** Receives the new supplier. */
  onCreated: (saved: SupplierDTO) => void;
  /** The company's custom supplier fields; loaded on demand when omitted. */
  fields?: CustomFieldDTO[];
}

/** «Nuevo proveedor»: RUC, razón social, contact data and the company's own fields. */
export function SupplierFormModal({ open, onClose, companyId, onCreated, fields }: Props) {
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const loaded = useApi<CustomFieldDTO[]>(
    () => (open && !fields && companyId ? customFieldsApi.list(companyId, "supplier") : Promise.resolve([])),
    [open, !fields, companyId],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Nuevo proveedor"
      description="Con su RUC lo reconocemos en tus compras y en tus archivos de Excel."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={formId} loading={saving} disabled={!companyId}>
            Crear proveedor
          </Button>
        </>
      }
    >
      <SupplierCreateForm
        formId={formId}
        companyId={companyId}
        fields={fields ?? loaded.data ?? []}
        onSavingChange={setSaving}
        onCreated={(saved) => {
          onCreated(saved);
          onClose();
        }}
      />
    </Modal>
  );
}
