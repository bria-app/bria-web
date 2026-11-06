"use client";

import { useMemo } from "react";
import { SmartImportWizard, type ImportTargetField } from "@/features/import/SmartImportWizard";
import { ensureNewColumns, newColumnsNote } from "@/features/import/newColumns";
import { supplierInsightsApi } from "@/services/api/purchasing";
import type { CustomFieldDTO } from "@/types/custom-fields";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string | null;
  fields: CustomFieldDTO[];
  onFinished: () => void;
}

const BASE_TARGETS: ImportTargetField[] = [
  { key: "ruc", label: "RUC", required: true, question: "¿Qué columna es el RUC?", synonyms: ["ruc", "n ruc", "nro ruc", "numero de ruc", "num ruc", "ruc proveedor"], hint: "11 dígitos" },
  { key: "business_name", label: "Nombre o razón social", required: true, question: "¿Qué columna es la razón social?", synonyms: ["razon social", "proveedor", "nombre", "empresa", "nombre proveedor", "denominacion"] },
  { key: "contact_name", label: "Contacto", synonyms: ["contacto", "vendedor", "representante", "nombre contacto", "asesor"] },
  { key: "phone", label: "Teléfono", synonyms: ["telefono", "celular", "movil", "tel", "whatsapp", "fono"] },
  { key: "email", label: "Correo", synonyms: ["correo", "email", "e mail", "mail", "correo electronico"] },
  { key: "address", label: "Dirección", synonyms: ["direccion", "domicilio", "direccion fiscal", "domicilio fiscal"] },
];

/** «Importar proveedores»: RUC and razón social at least; an existing RUC is updated, not duplicated. */
export function SupplierImportWizard({ open, onClose, companyId, fields, onFinished }: Props) {
  const targets = useMemo<ImportTargetField[]>(
    () => [...BASE_TARGETS, ...fields.map((f) => ({ key: `custom:${f.key}`, label: f.label, synonyms: [f.label, f.key] }))],
    [fields],
  );

  return (
    <SmartImportWizard
      open={open}
      onClose={onClose}
      title="Importar proveedores"
      entityLabel="proveedores"
      targetFields={targets}
      allowNewColumns
      uploadHint={
        <>
          Tu archivo necesita al menos <strong className="text-text-primary">RUC</strong> y{" "}
          <strong className="text-text-primary">razón social</strong>. Si un RUC ya existe, actualizamos sus datos en vez de
          duplicarlo. Las columnas extra (por ejemplo «Banco» o «N.º de cuenta») se pueden guardar como campos propios.
        </>
      }
      onImport={async (rows, newColumns) => {
        if (!companyId) throw new Error("Tu sesión se cerró. Vuelve a entrar e inténtalo de nuevo.");
        const savedKeys = await ensureNewColumns(companyId, "supplier", newColumns);
        const res = await supplierInsightsApi.import(
          companyId,
          rows.map((r) => ({
            row: r.rowNumber,
            ruc: r.values.ruc ?? "",
            business_name: r.values.business_name ?? "",
            contact_name: r.values.contact_name,
            phone: r.values.phone,
            email: r.values.email,
            address: r.values.address,
            custom_attributes: savedKeys(r.custom),
          })),
        );
        return {
          created: res.created,
          updated: res.updated,
          skipped: res.skipped,
          errors: res.errors,
          notes: [newColumnsNote(newColumns.length, "proveedores")].filter((n): n is string => n !== null),
        };
      }}
      onFinished={onFinished}
    />
  );
}
