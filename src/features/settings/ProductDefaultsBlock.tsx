"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ProductDefaultsFields } from "@/features/products/ProductDefaultsFields";
import { useProductDefaults, type ProductDefaults } from "@/features/products/productDefaults";
import { SettingsBlock } from "./SettingsBlock";

/** Configuración › Negocio › «Al crear productos»: the answers given before the first product. */
export function ProductDefaultsBlock({ companyId, canEdit }: { companyId: string | null; canEdit: boolean }) {
  const defaults = useProductDefaults(companyId);
  const toast = useToast();
  const [draft, setDraft] = useState<ProductDefaults | null>(null);
  const [saving, setSaving] = useState(false);
  const value = draft ?? defaults.value;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(defaults.value);

  const save = async () => {
    if (!draft) return;
    const previous = defaults.value;
    setSaving(true);
    try {
      await defaults.save({ ...draft, confirmed_at: previous.confirmed_at ?? new Date().toISOString() });
      setDraft(null);
      toast("Guardamos cómo creas productos", { undo: () => void defaults.save(previous).catch(() => toast("No se pudo deshacer. Inténtalo de nuevo.")) });
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsBlock
      title="Al crear productos"
      hint="Se llena solo en cada producto nuevo y en tus archivos de Excel. Vale para todo tu equipo."
      action={
        canEdit &&
        dirty && (
          <>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
              Descartar
            </Button>
            <Button variant="strong" onClick={() => void save()} loading={saving}>
              Guardar cambios
            </Button>
          </>
        )
      }
    >
      <ProductDefaultsFields value={value} onChange={setDraft} disabled={!canEdit || saving || defaults.loading} />
    </SettingsBlock>
  );
}
