"use client";

import { Modal } from "@/components/ui/Modal";
import { PredictionTour } from "./PredictionTour";

/** The tour in a dialog: from the first-time invitation, «¿Cómo funciona?» and Configuración. */
export function PredictionTourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Cómo predice bria." description="De tu caja a tu próxima compra, en siete pasos." size="xl">
      <PredictionTour onDone={onClose} />
    </Modal>
  );
}
