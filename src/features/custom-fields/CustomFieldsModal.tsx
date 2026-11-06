"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomFieldsManager } from "./CustomFieldsManager";
import type { StorableEntity } from "./entities";

interface CustomFieldsModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  initialEntity?: StorableEntity;
  onChanged?: (entity: StorableEntity) => void;
}

/** The custom-fields manager in a dialog, for screens that open it from a table or a sheet. */
export function CustomFieldsModal({ open, onClose, companyId, initialEntity, onChanged }: CustomFieldsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Tus columnas"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <CustomFieldsManager companyId={companyId} initialEntity={initialEntity} onChanged={onChanged} />
    </Modal>
  );
}
