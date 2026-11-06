"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { announceAdjustment } from "@/features/inventory/adjustmentToast";
import { productStatus } from "@/features/inventory/stockStatus";
import { ProductHeader } from "@/features/inventory/product/ProductHeader";
import { SummaryTab } from "@/features/inventory/product/SummaryTab";
import { SheetTab } from "@/features/inventory/product/SheetTab";
import { KardexTab } from "@/features/inventory/product/KardexTab";
import { SaveBar } from "@/components/ui/SaveBar";
import { useProductDraft } from "@/features/inventory/product/useProductDraft";
import { DialogLoading, useOpenedOnce } from "@/components/ui/lazyDialog";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { categoriesApi } from "@/services/api/resources";
import { catalogApi } from "@/services/api/inventory";
import { customFieldsApi } from "@/services/api/custom-fields";
import type { CategoryDTO } from "@/types/api";
import type { CustomFieldDTO } from "@/types/custom-fields";

const StockAdjustmentModal = dynamic(() => import("@/features/inventory/StockAdjustmentModal").then((m) => m.StockAdjustmentModal), {
  ssr: false,
  loading: DialogLoading,
});
const CustomFieldsModal = dynamic(() => import("@/features/custom-fields/CustomFieldsModal").then((m) => m.CustomFieldsModal), {
  ssr: false,
  loading: DialogLoading,
});

type Tab = "resumen" | "ficha" | "kardex";

/** Product page: summary, the editable sheet and every movement in and out. */
export default function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const toast = useToast();
  const companyId = useCompanyId();
  const timelineQ = useApi(() => (companyId ? catalogApi.timeline(companyId, productId) : Promise.resolve(null)), [companyId, productId]);
  const categoriesQ = useApi(() => (companyId ? categoriesApi.list(companyId) : Promise.resolve([] as CategoryDTO[])), [companyId]);
  const fieldsQ = useApi(() => (companyId ? customFieldsApi.list(companyId, "product") : Promise.resolve([] as CustomFieldDTO[])), [companyId]);
  const categories = useMemo(() => categoriesQ.data ?? [], [categoriesQ.data]);
  const fields = useMemo(() => fieldsQ.data ?? [], [fieldsQ.data]);

  const [tab, setTab] = useState<Tab>("resumen");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const adjustLoaded = useOpenedOnce(adjustOpen);
  const fieldsLoaded = useOpenedOnce(fieldsOpen);

  const timeline = timelineQ.data;
  const draft = useProductDraft(companyId, timeline?.product ?? null, fields, categories);
  const product = draft.product;

  if (!timeline || !product || !draft.form) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <Link href="/inventory" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Inventario
        </Link>
        <DataState loading={timelineQ.loading} error={timelineQ.error} onRetry={timelineQ.reload} empty emptyMessage="No encontramos este producto.">
          {null}
        </DataState>
      </div>
    );
  }

  const stats = timeline.stats;
  const status = productStatus(stats.stock_on_hand, product.safety_stock, product.reorder_point, stats.coverage_days, product.lead_time_days);
  const errorCount = Object.keys(draft.errors).length;

  const save = async () => {
    const res = await draft.save();
    if (!res) {
      setTab("ficha");
      return;
    }
    timelineQ.reload();
    toast(`Guardaste ${res.changes} ${res.changes === 1 ? "cambio" : "cambios"} en «${product.name}».`, {
      undo: () => {
        draft
          .restore(res.before)
          .then(() => {
            timelineQ.reload();
            toast("Listo, volvió a como estaba.");
          })
          .catch((err: unknown) => toast(err instanceof Error ? err.message : "No se pudo deshacer."));
      },
    });
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <ProductHeader product={product} categoryPath={timeline.category_path} status={status} onAdjust={() => setAdjustOpen(true)} />

      <Tabs
        value={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: "resumen", label: "Resumen" },
          { id: "ficha", label: "Ficha" },
          { id: "kardex", label: "Entradas y salidas", count: timeline.events.length },
        ]}
      />

      {tab === "resumen" && <SummaryTab companyId={companyId} product={product} timeline={timeline} status={status} />}
      {tab === "ficha" && (
        <SheetTab
          companyId={companyId}
          product={product}
          form={draft.form}
          errors={draft.errors}
          set={draft.set}
          setCustom={draft.setCustom}
          categories={categories}
          fields={fields}
          applicable={draft.applicable}
          stockOnHand={stats.stock_on_hand}
          disabled={draft.saving}
          onAdjust={() => setAdjustOpen(true)}
          onManageFields={() => setFieldsOpen(true)}
          onFieldCreated={fieldsQ.reload}
          onDeleted={() => {
            toast(`Eliminaste «${product.name}».`);
            router.push("/inventory");
          }}
          onPause={async () => {
            await draft.pause();
            timelineQ.reload();
            toast(`«${product.name}» quedó en pausa.`);
          }}
        />
      )}
      {tab === "kardex" && <KardexTab events={timeline.events} truncated={timeline.events_truncated} />}

      {(draft.dirty > 0 || draft.error) && (
        <SaveBar message={saveMessage(draft.dirty, errorCount, draft.error)} saving={draft.saving} onSave={() => void save()} onDiscard={draft.discard} />
      )}

      {adjustLoaded && (
        <StockAdjustmentModal
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          companyId={companyId}
          productId={product.id}
          products={[{ id: product.id, name: product.name, sku: product.sku, stock_on_hand: stats.stock_on_hand, image_url: product.image_url }]}
          onDone={(res) => {
            timelineQ.reload();
            if (companyId) announceAdjustment(toast, companyId, product.name, res, timelineQ.reload);
          }}
        />
      )}
      {fieldsLoaded && (
        <CustomFieldsModal
          open={fieldsOpen}
          onClose={() => setFieldsOpen(false)}
          companyId={companyId}
          initialEntity="product"
          onChanged={(e) => e === "product" && fieldsQ.reload()}
        />
      )}
    </div>
  );
}

function saveMessage(changes: number, errorCount: number, error: string | null): string {
  if (error) return error;
  if (errorCount > 0) return `Revisa ${errorCount === 1 ? "el campo marcado" : `los ${errorCount} campos marcados`} antes de guardar.`;
  return `${changes} ${changes === 1 ? "cambio" : "cambios"} sin guardar`;
}
