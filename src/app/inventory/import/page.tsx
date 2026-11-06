"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DialogLoading } from "@/components/ui/lazyDialog";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useApi } from "@/hooks/useApi";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CustomFieldDTO } from "@/types/custom-fields";

// The wizard (and the spreadsheet reader inside it) loads in its own chunk, after the page.
const ProductImportWizard = dynamic(() => import("@/features/inventory/ProductImportWizard").then((m) => m.ProductImportWizard), {
  ssr: false,
  loading: DialogLoading,
});

const FACTS = [
  { title: "Tu archivo tal cual", text: "Reconocemos columnas como «Cód.», «PVP» o «Existencia», en cualquier orden. Si no, tú eliges qué es cada una." },
  { title: "Productos que ya tienes", text: "Se encuentran por código o código de barras. Tú decides si se actualizan o se saltan." },
  { title: "Tu inventario queda registrado", text: "Las unidades de cada fila quedan como una carga desde Excel, visible en las entradas y salidas del producto." },
  { title: "Sin deshacer automático", text: "Lo importado no se revierte de golpe. Revisa la vista previa antes de confirmar." },
];

/** «Importar productos»: what the import does, then the wizard. */
export default function InventoryImportPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const fields = useApi(() => (companyId ? customFieldsApi.list(companyId, "product") : Promise.resolve([] as CustomFieldDTO[])), [companyId]);
  const [open, setOpen] = useState(true);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <Link href="/inventory" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Inventario
      </Link>
      <PageHeader
        title="Importar productos"
        description="Sube tu Excel o CSV con productos, precios y unidades. Antes de guardar ves cada fila y corriges lo que haga falta."
        action={
          <Button onClick={() => setOpen(true)} disabled={!companyId}>
            <FileSpreadsheet aria-hidden className="h-4 w-4" /> Elegir archivo
          </Button>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {FACTS.map((f) => (
          <li key={f.title} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[15px] font-semibold text-text-primary">{f.title}</p>
            <p className="mt-1 text-sm text-text-secondary">{f.text}</p>
          </li>
        ))}
      </ul>
      <ProductImportWizard
        open={open}
        onClose={() => setOpen(false)}
        companyId={companyId}
        fields={fields.data ?? []}
        onFinished={() => router.push("/inventory")}
      />
    </div>
  );
}
