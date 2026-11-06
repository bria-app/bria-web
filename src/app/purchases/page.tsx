"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackagePlus, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchaseDocumentModal } from "@/features/purchases/lazyPurchaseDocument";
import { useOpenedOnce } from "@/components/ui/lazyDialog";
import { EMPTY_FILTERS, PurchaseFilters, periodRange, type PurchaseFilterState } from "@/features/purchases/PurchaseFilters";
import { PurchasesTable } from "@/features/purchases/PurchasesTable";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useListView } from "@/hooks/useDevicePref";
import { useInfiniteList, useLoadsMore } from "@/hooks/useInfiniteList";
import { suppliersApi } from "@/services/api/resources";
import { purchasingApi } from "@/services/api/purchasing";
import type { SupplierDTO } from "@/types/api";
import type { PurchaseDocumentDTO } from "@/types/purchasing";

const PAGE_SIZE = 25;

/** «Compras»: every supplier document, filtered by supplier, period or number. */
export default function PurchasesPage() {
  const companyId = useCompanyId();
  const initialSupplier = useQueryParam("supplier");
  const [filters, setFilters] = useState<PurchaseFilterState>(() => ({ ...EMPTY_FILTERS, supplierId: initialSupplier }));
  const [q, setQ] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const docLoaded = useOpenedOnce(docId !== null);
  const [view] = useListView("compras");

  useEffect(() => {
    const t = window.setTimeout(() => setQ(filters.search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  const range = periodRange(filters);
  const suppliers = useApi(() => (companyId ? suppliersApi.list(companyId) : Promise.resolve([] as SupplierDTO[])), [companyId]);
  const docs = useInfiniteList<PurchaseDocumentDTO>(
    (page) =>
      companyId
        ? purchasingApi
            .documents(companyId, { supplier_id: filters.supplierId, ...range, q, page, size: PAGE_SIZE })
            .then((r) => ({ items: r.items, total: r.total, hasMore: page < r.pages }))
        : Promise.resolve({ items: [], total: 0, hasMore: false }),
    (d) => d.document_id,
    [companyId, filters.supplierId, range.date_from, range.date_to, q],
  );
  useLoadsMore(docs);

  const supplierOptions = useMemo(
    () => [
      { value: "", label: "Todos los proveedores" },
      ...(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.business_name, description: `RUC ${s.ruc}` })),
    ],
    [suppliers.data],
  );

  const changeFilters = setFilters;

  const filtered = !!(filters.supplierId || filters.period !== "all" || q);
  const items = docs.items;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Compras"
        description="Lo que le compraste a tus proveedores."
        action={
          <>
            <Link href="/purchases/new?tab=import" className="btn btn-secondary h-11 px-4 text-sm">
              Subir Excel
            </Link>
            <Link href="/purchases/new" className="btn btn-primary h-11 gap-2 px-4 text-sm">
              <PackagePlus aria-hidden className="h-4 w-4" /> Nueva compra
            </Link>
          </>
        }
      />

      <PurchaseFilters value={filters} onChange={changeFilters} supplierOptions={supplierOptions} />

      <DataState
        loading={docs.loading && items.length === 0}
        error={docs.error}
        onRetry={docs.reload}
        empty={!docs.loading && items.length === 0}
        emptyState={
          filtered ? (
            <EmptyState
              icon={Receipt}
              title="No hay compras con esos filtros"
              description="Prueba con otro proveedor u otro periodo."
              hint={
                <button type="button" onClick={() => changeFilters(EMPTY_FILTERS)} className="font-semibold text-accent-text hover:underline">
                  Quitar los filtros
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="Aún no registras compras"
              description="Cuando te llegue mercadería, toca «Nueva compra» y anota la factura. Tu inventario se actualiza solo."
              hint={
                <Link href="/purchases/new?tab=import" className="font-semibold text-accent-text hover:underline">
                  ¿Tienes tus compras en Excel? Súbelas
                </Link>
              }
            />
          )
        }
      >
        <PurchasesTable list={docs} onOpen={setDocId} view={view} />
      </DataState>

      {docLoaded && <PurchaseDocumentModal open={docId !== null} onClose={() => setDocId(null)} companyId={companyId} documentId={docId} />}
    </div>
  );
}
