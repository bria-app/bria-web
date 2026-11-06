"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProductDefaultsFields } from "./ProductDefaultsFields";
import type { ProductDefaults } from "./productDefaults";

interface FirstProductSetupProps {
  open: boolean;
  onClose: () => void;
  /** «Ahora no»: straight to the form with the usual values; the questions come back next time. */
  onSkip: () => void;
  initial: ProductDefaults;
  /** Persists the answers; the product form opens right after. */
  onSave: (defaults: ProductDefaults) => Promise<void>;
}

/** Before the first product: how this shop codes, counts and prices, asked once. */
export function FirstProductSetup({ open, onClose, onSkip, initial, onSave }: FirstProductSetupProps) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, confirmed_at: new Date().toISOString() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Antes de agregar productos"
      description="Cinco preguntas, una sola vez, para llenar por ti lo que se repite. Luego las cambias en Configuración → Negocio."
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={onSkip} disabled={saving}>
            Ahora no
          </Button>
          <Button onClick={() => void save()} loading={saving} data-autofocus>
            Guardar y crear producto
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
        <ProductDefaultsFields value={draft} onChange={setDraft} disabled={saving} />
      </div>
    </Modal>
  );
}
