"use client";

import { Skeleton } from "@/components/ui/DataState";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { DataState } from "@/components/ui/DataState";
import { PurchaseForm } from "@/features/purchases/PurchaseForm";
import { PurchaseImportPanel } from "@/features/purchases/PurchaseImportPanel";
import { usePurchasePrefill } from "@/features/purchases/usePurchasePrefill";
import { useOpenedOnce } from "@/components/ui/lazyDialog";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { suppliersApi } from "@/services/api/resources";
import { customFieldsApi } from "@/services/api/custom-fields";
import { purchasingApi } from "@/services/api/purchasing";
import type { SupplierDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";
import type { PurchaseCatalogItemDTO } from "@/types/purchasing";

type Tab = "register" | "import";

/** «Nueva compra»: type one supplier document, or upload it from Excel. */
export default function NewPurchasePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <NewPurchase />
    </Suspense>
  );
}

function NewPurchase() {
  const companyId = useCompanyId();
  const initialSupplier = useQueryParam("supplier");
  const tabParam = useQueryParam("tab");
  // «Registrar compra» from a «por reponer» alert: ?product=<id>&cantidad=<n> (repeatable).
  const prefill = usePurchasePrefill();
  const [tab, setTab] = useState<Tab>(tabParam === "import" && prefill.length === 0 ? "import" : "register");

  const suppliers = useApi(() => (companyId ? suppliersApi.list(companyId) : Promise.resolve([] as SupplierDTO[])), [companyId]);
  const catalog = useApi(() => (companyId ? purchasingApi.catalog(companyId) : Promise.resolve([] as PurchaseCatalogItemDTO[])), [companyId]);
  // Product fields only matter to the Excel upload: fetched the first time that tab opens.
  const importSeen = useOpenedOnce(tab === "import");
  const productFields = useApi(
    () => (companyId && importSeen ? customFieldsApi.list(companyId, "product") : Promise.resolve([] as CustomFieldDTO[])),
    [companyId, importSeen],
  );

  const ready = !!companyId && !!suppliers.data && !!catalog.data;
  const loadError = (!suppliers.data && suppliers.error) || (!catalog.data && catalog.error) || null;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <Link href="/purchases" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Compras
      </Link>
      <PageHeader
        title="Nueva compra"
        description="Anota la mercadería que ya te llegó."
      />

      <Tabs
        value={tab}
        onChange={(id) => setTab(id === "import" ? "import" : "register")}
        tabs={[
          { id: "register", label: "Anotar una compra" },
          { id: "import", label: "Subir Excel" },
        ]}
      />

      {/* A failed background reload (after saving) keeps the data on screen instead of the error. */}
      <DataState
        loading={!ready && !loadError}
        error={loadError}
        onRetry={() => {
          suppliers.reload();
          catalog.reload();
        }}
      >
        {/* Both tabs stay mounted once opened, so switching never throws away a half-typed purchase. */}
        {ready && (
          <>
            <div hidden={tab !== "register"}>
              <PurchaseForm
                companyId={companyId}
                suppliers={suppliers.data ?? []}
                catalog={catalog.data ?? []}
                initialSupplierId={initialSupplier}
                prefill={prefill}
                onSuppliersChanged={suppliers.reload}
                onRegistered={catalog.reload}
              />
            </div>
            {importSeen && (
              <div hidden={tab !== "import"}>
                <PurchaseImportPanel
                  companyId={companyId}
                  suppliers={suppliers.data ?? []}
                  productFields={productFields.data ?? []}
                  initialSupplierId={initialSupplier}
                  onImported={() => {
                    catalog.reload();
                    productFields.reload();
                  }}
                />
              </div>
            )}
          </>
        )}
      </DataState>
    </div>
  );
}
