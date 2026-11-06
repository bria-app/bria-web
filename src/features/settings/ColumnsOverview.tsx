"use client";

import { useState } from "react";
import { Lock, Settings2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataState } from "@/components/ui/DataState";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { AlertBadges } from "@/features/custom-fields/AlertBadges";
import { CustomFieldsModal } from "@/features/custom-fields/CustomFieldsModal";
import { validationParts } from "@/features/custom-fields/ruleText";
import { ENTITY_LABEL, type StorableEntity } from "@/features/custom-fields/entities";
import { useApi } from "@/hooks/useApi";
import { customFieldsApi } from "@/services/api/custom-fields";
import { cn } from "@/lib/utils";
import { CUSTOM_FIELD_TYPE_LABEL, type CustomFieldDTO } from "@/types/custom-fields";
import { SettingsBlock } from "./SettingsBlock";

type Rule = "obligatorio" | "automatico" | "opcional";

/** The built-in columns of each record and how the app treats them (as the forms and the API do). */
const BUILT_IN: Record<StorableEntity, { label: string; rule: Rule; note?: string }[]> = {
  product: [
    { label: "Nombre", rule: "obligatorio" },
    { label: "Precio de venta", rule: "obligatorio" },
    { label: "Código (SKU)", rule: "automatico", note: "El código de barras o uno correlativo si lo dejas vacío" },
    { label: "Código de barras", rule: "opcional" },
    { label: "Categoría", rule: "opcional" },
    { label: "Costo", rule: "opcional", note: "Se actualiza con cada compra" },
    { label: "Inventario mínimo", rule: "opcional" },
    { label: "Comprar al llegar a", rule: "opcional" },
    { label: "Días que tarda el proveedor", rule: "opcional" },
    { label: "Unidad", rule: "automatico", note: "La que elegiste en «Al crear productos»" },
    { label: "Foto y descripción", rule: "opcional" },
  ],
  supplier: [
    { label: "RUC", rule: "obligatorio", note: "11 dígitos, se valida el dígito final" },
    { label: "Razón social", rule: "obligatorio" },
    { label: "Contacto", rule: "opcional" },
    { label: "Teléfono", rule: "opcional" },
    { label: "Correo", rule: "opcional" },
    { label: "Dirección", rule: "opcional" },
  ],
};

const RULE: Record<Rule, { label: string; tone: "accent" | "info" | "neutral" }> = {
  obligatorio: { label: "Obligatorio", tone: "accent" },
  automatico: { label: "Automático", tone: "info" },
  opcional: { label: "Opcional", tone: "neutral" },
};

/** «Solo para algunas categorías · Solo dígitos (0-9)», or "" when nothing is special. */
const ownNotes = (f: CustomFieldDTO) =>
  [f.category_ids.length > 0 ? "Solo para algunas categorías" : null, ...validationParts(f.field_type, f.rules?.validation)].filter(Boolean).join(" · ");

const ENTITIES = (Object.keys(ENTITY_LABEL) as StorableEntity[]).map((e) => ({ value: e, label: ENTITY_LABEL[e].plural }));

/**
 * Configuración › Negocio › «Campos y columnas»: every column of products and suppliers at a
 * glance (built-in and the shop's own), which ones are required, and quick switches for the
 * shop's own ones. Creating and deeper editing open the full manager.
 */
export function ColumnsOverview({ companyId, canEdit }: { companyId: string | null; canEdit: boolean }) {
  const toast = useToast();
  const [entity, setEntity] = useState<StorableEntity>("product");
  const [managerOpen, setManagerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // The answer carries its entity: while another tab loads, the previous tab's fields never show under it.
  const fieldsQ = useApi(
    async () => ({ entity, fields: companyId ? await customFieldsApi.list(companyId, entity) : ([] as CustomFieldDTO[]) }),
    [companyId, entity],
  );
  const loaded = fieldsQ.data?.entity === entity ? fieldsQ.data : null;
  const own = loaded?.fields ?? [];
  const builtIn = BUILT_IN[entity];
  const required = builtIn.filter((c) => c.rule === "obligatorio").length + own.filter((f) => f.is_required).length;

  const toggle = async (field: CustomFieldDTO, key: "is_required" | "is_visible", value: boolean) => {
    if (!companyId) return;
    setBusyId(field.id);
    try {
      await customFieldsApi.update(companyId, field.id, { [key]: value });
      fieldsQ.reload();
      const what = key === "is_required" ? (value ? "ahora es obligatorio" : "ya no es obligatorio") : value ? "se ve en la lista" : "se ocultó de la lista";
      toast(`«${field.label}» ${what}`, {
        undo: () => void customFieldsApi.update(companyId, field.id, { [key]: !value }).then(fieldsQ.reload),
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SettingsBlock
      title="Campos y columnas"
      hint="Lo que guardas de cada producto y proveedor, y lo que es obligatorio al crearlos. Lo mismo se ve en sus fichas, en las listas y en tu plantilla de Excel."
      action={
        canEdit && (
          <Button variant="secondary" onClick={() => setManagerOpen(true)} disabled={!companyId}>
            <Settings2 aria-hidden className="h-4 w-4" /> Crear y administrar
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<StorableEntity> label="Campos de" value={entity} options={ENTITIES} onChange={setEntity} />
        <p className="text-[13px] text-text-secondary">
          <span className="font-mono text-text-primary">{builtIn.length + own.length}</span> columnas ·{" "}
          <span className="font-mono text-text-primary">{required}</span> obligatorias ·{" "}
          <span className="font-mono text-text-primary">{own.length}</span> tuyas
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="cols-base" className="flex flex-col gap-2">
          <h3 id="cols-base" className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary">
            <Lock aria-hidden className="h-3.5 w-3.5" /> Las de bria
          </h3>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {builtIn.map((c) => (
              <li key={c.label} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-text-primary">{c.label}</span>
                  {c.note && <span className="block text-[12px] text-text-muted">{c.note}</span>}
                </span>
                <Badge tone={RULE[c.rule].tone}>{RULE[c.rule].label}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cols-own" className="flex flex-col gap-2">
          <h3 id="cols-own" className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary">
            <Sparkles aria-hidden className="h-3.5 w-3.5" /> Las tuyas
          </h3>
          <DataState loading={fieldsQ.loading && !loaded} error={fieldsQ.error} onRetry={fieldsQ.reload}>
            {own.length === 0 ? (
              <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border p-5">
                <p className="text-[14px] font-semibold text-text-primary">Aún no tienes columnas propias</p>
                <p className="text-[13px] text-text-secondary">
                  Talla, color, lote, fecha de vencimiento: crea las que tu negocio necesite. También puedes hacerlo al agregar un{" "}
                  {ENTITY_LABEL[entity].one}.
                </p>
                {canEdit && (
                  <Button size="sm" variant="strong" onClick={() => setManagerOpen(true)}>
                    Crear la primera
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {own.map((f) => (
                  <li key={f.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5", !f.is_visible && "bg-surface-soft")}>
                    <span className="min-w-[140px] flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-[14px] text-text-primary">
                        {f.label}
                        <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] text-text-secondary">{CUSTOM_FIELD_TYPE_LABEL[f.field_type]}</span>
                      </span>
                      {ownNotes(f) && <span className="block text-[12px] text-text-muted">{ownNotes(f)}</span>}
                      {entity === "product" && f.rules?.alert && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-text-muted">
                          Avisa <AlertBadges alerts={[{ key: f.key, column: f.label, label: f.rules.alert.label, tone: f.rules.alert.tone }]} withColumn={false} />
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-4">
                      <Switch
                        showLabel
                        label="Obligatorio"
                        checked={f.is_required}
                        disabled={!canEdit || busyId === f.id}
                        onChange={(v) => void toggle(f, "is_required", v)}
                      />
                      <Switch
                        showLabel
                        label="Visible"
                        checked={f.is_visible}
                        disabled={!canEdit || busyId === f.id}
                        onChange={(v) => void toggle(f, "is_visible", v)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DataState>
          <p className="text-[12px] text-text-muted">
            Obligatorio se pide en los formularios de bria; las importaciones de Excel no lo exigen.
          </p>
        </section>
      </div>

      <CustomFieldsModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        companyId={companyId}
        initialEntity={entity}
        onChanged={() => fieldsQ.reload()}
      />
    </SettingsBlock>
  );
}
