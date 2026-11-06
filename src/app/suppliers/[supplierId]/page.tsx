"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { DataState } from "@/components/ui/DataState";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import { SupplierHeader } from "@/features/suppliers/SupplierHeader";
import { SupplierProductsTab } from "@/features/suppliers/SupplierProductsTab";
import { SupplierProfile } from "@/features/suppliers/SupplierProfile";
import { SupplierPurchasesTab } from "@/features/suppliers/SupplierPurchasesTab";
import { SUPPLIER_COLUMNS } from "@/features/suppliers/supplierColumns";
import { useApi } from "@/hooks/useApi";
import { useColumnConfig } from "@/hooks/useColumnConfig";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supplierInsightsApi } from "@/services/api/purchasing";
import type { SupplierSummaryDTO } from "@/types/purchasing";

const ColumnsManager = dynamic(() => import("@/features/custom-fields/ColumnsManager").then((m) => m.ColumnsManager), {
  ssr: false,
  loading: DialogLoading,
});

type Tab = "ficha" | "productos" | "compras";

/** One supplier: its figures, the editable sheet, what it sells you and every purchase. */
export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const companyId = useCompanyId();
  const router = useRouter();
  const toast = useToast();
  const columns = useColumnConfig(companyId, "supplier");
  const [tab, setTab] = useState<Tab>("ficha");
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const fieldsLoaded = useOpenedOnce(fieldsOpen);

  const summary = useApi<SupplierSummaryDTO | null>(
    () => (companyId && supplierId ? supplierInsightsApi.summary(companyId, supplierId) : Promise.resolve(null)),
    [companyId, supplierId],
  );
  const data = summary.data;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Outside DataState: a deleted or missing supplier still has a way back. */}
      <Link href="/suppliers" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft aria-hidden className="h-4 w-4" /> Proveedores
      </Link>
      <DataState loading={!companyId || (summary.loading && !data)} error={summary.error} onRetry={summary.reload}>
        {data && (
          <>
            <SupplierHeader summary={data} />
            <Tabs
              value={tab}
              onChange={(id) => setTab(id as Tab)}
              tabs={[
                { id: "ficha", label: "Ficha" },
                { id: "productos", label: "Productos", count: data.products_count },
                { id: "compras", label: "Compras", count: data.documents_count },
              ]}
            />
            {/* Kept mounted while another tab is open, so unsaved edits survive. */}
            <div hidden={tab !== "ficha"}>
              <SupplierProfile
                key={data.supplier.id}
                companyId={companyId}
                supplier={data.supplier}
                fields={columns.fields}
                purchases={data.documents_count}
                onSaved={summary.reload}
                onDeleted={() => {
                  toast(`Eliminaste a «${data.supplier.business_name}».`);
                  router.push("/suppliers");
                }}
                onManageFields={() => setFieldsOpen(true)}
              />
            </div>
            {tab === "productos" && <SupplierProductsTab companyId={companyId} products={data.products} />}
            {tab === "compras" && <SupplierPurchasesTab companyId={companyId} supplierId={data.supplier.id} />}
          </>
        )}
      </DataState>

      {fieldsLoaded && (
        <ColumnsManager
          open={fieldsOpen}
          onClose={() => setFieldsOpen(false)}
          companyId={companyId}
          entity="supplier"
          entityLabel="proveedores"
          builtinColumns={SUPPLIER_COLUMNS}
          hiddenBuiltins={columns.hiddenBuiltins}
          onHiddenBuiltinsChange={columns.setHiddenBuiltins}
          fields={columns.fields}
          onFieldsChanged={columns.reloadFields}
        />
      )}
    </div>
  );
}
