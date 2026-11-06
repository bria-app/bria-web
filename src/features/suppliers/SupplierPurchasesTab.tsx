"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PurchasesTable } from "@/features/purchases/PurchasesTable";
import { PurchaseDocumentModal } from "@/features/purchases/lazyPurchaseDocument";
import { useOpenedOnce } from "@/components/ui/lazyDialog";
import { useInfiniteList, useLoadsMore } from "@/hooks/useInfiniteList";
import { purchasingApi } from "@/services/api/purchasing";
import type { PurchaseDocumentDTO } from "@/types/purchasing";

const PAGE_SIZE = 25;

/** Every purchase document registered with this supplier. */
export function SupplierPurchasesTab({ companyId, supplierId }: { companyId: string | null; supplierId: string }) {
  const [docId, setDocId] = useState<string | null>(null);
  const docLoaded = useOpenedOnce(docId !== null);
  const docs = useInfiniteList<PurchaseDocumentDTO>(
    (page) =>
      companyId
        ? purchasingApi
            .documents(companyId, { supplier_id: supplierId, page, size: PAGE_SIZE })
            .then((r) => ({ items: r.items, total: r.total, hasMore: page < r.pages }))
        : Promise.resolve({ items: [], total: 0, hasMore: false }),
    (d) => d.document_id,
    [companyId, supplierId],
  );
  useLoadsMore(docs);

  return (
    <>
      <DataState
        loading={docs.loading && docs.items.length === 0}
        error={docs.error}
        onRetry={docs.reload}
        empty={!docs.loading && docs.items.length === 0}
        emptyState={
          <EmptyState
            icon={Receipt}
            title="Aún no le registras compras"
            description="Cuando te llegue mercadería de este proveedor, toca «Registrar compra». Aquí quedará cada factura."
          />
        }
      >
        <PurchasesTable list={docs} onOpen={setDocId} hideSupplier />
      </DataState>
      {docLoaded && <PurchaseDocumentModal open={docId !== null} onClose={() => setDocId(null)} companyId={companyId} documentId={docId} />}
    </>
  );
}
