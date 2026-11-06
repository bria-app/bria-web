"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useRole } from "@/hooks/useRole";
import { ImportedHistory } from "@/features/sales/ImportedHistory";
import { OrdersView } from "@/features/sales/OrdersView";

// The import wizard is a big dialog behind a button: it is downloaded only when the owner opens it.
const SalesImportWizard = dynamic(() => import("@/features/sales/SalesImportWizard").then((m) => m.SalesImportWizard), {
  ssr: false,
  loading: () => (
    <span role="status" className="sr-only">
      Abriendo el importador…
    </span>
  ),
});

type Tab = "tickets" | "imported";

export default function SalesPage() {
  const companyId = useCompanyId();
  const { isSeller, isAdmin } = useRole();
  // `/sales?tab=imported` (from the forecast guide) opens the imported history.
  const tabParam = useQueryParam("tab");
  const sellerParam = useQueryParam("vendedor");
  const [tab, setTab] = useState<Tab>(tabParam === "imported" ? "imported" : "tickets");
  const [importOpen, setImportOpen] = useState(false);
  // Mounted from the first opening on, so the dialog closes normally afterwards.
  const [importLoaded, setImportLoaded] = useState(false);
  const [imports, setImports] = useState(0);

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title={isSeller ? "Mis ventas" : "Ventas"}
        description={isSeller ? "Lo que cobraste. Toca una venta para ver el detalle." : "Cada venta cobrada y cuánto suma. Toca una para ver el detalle."}
        action={
          <>
            {isAdmin && (
              <Button
                variant="secondary"
                onClick={() => {
                  setImportLoaded(true);
                  setImportOpen(true);
                }}
              >
                <Upload aria-hidden className="h-4 w-4" /> Importar ventas
              </Button>
            )}
            <Link href="/sales/new" className="btn btn-primary h-11 gap-2 px-4 text-sm">
              <Plus aria-hidden className="h-4 w-4" /> Nueva venta
            </Link>
          </>
        }
      />

      <div className="tab-stage flex flex-col gap-6">
        {!isSeller && (
          <Tabs
            tabs={[
              { id: "tickets", label: "Ventas" },
              { id: "imported", label: "Historial importado" },
            ]}
            value={tab}
            onChange={(id) => setTab(id === "imported" ? "imported" : "tickets")}
          />
        )}

        {companyId &&
          (tab === "imported" && !isSeller ? (
            <ImportedHistory companyId={companyId} refreshKey={imports} />
          ) : (
            <OrdersView companyId={companyId} isSeller={isSeller} canFilterSeller={isAdmin} refreshKey={imports} initialSellerId={sellerParam} />
          ))}
      </div>

      {isAdmin && importLoaded && (
        <SalesImportWizard
          open={importOpen}
          onClose={() => setImportOpen(false)}
          companyId={companyId}
          onFinished={() => setImports((n) => n + 1)}
        />
      )}
    </div>
  );
}
