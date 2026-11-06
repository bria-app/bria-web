"use client";

import { DataState } from "@/components/ui/DataState";
import { useApi } from "@/hooks/useApi";
import { useCompanyId } from "@/hooks/useCompanyId";
import { loadCompany } from "@/hooks/useProfile";
import { BusinessForm } from "./BusinessForm";
import { ColumnsOverview } from "./ColumnsOverview";
import { ProductDefaultsBlock } from "./ProductDefaultsBlock";

/** Configuración › Negocio: the company record (GET / PATCH /companies/{id}) and how products are created. */
export function BusinessSection({ canEdit }: { canEdit: boolean }) {
  const companyId = useCompanyId();
  const company = useApi(() => (companyId ? loadCompany(companyId) : Promise.resolve(null)), [companyId]);

  return (
    <div className="flex flex-col gap-6">
      <DataState loading={company.loading && !company.data} error={company.error} onRetry={company.reload}>
        {company.data && <BusinessForm key={company.data.id} company={company.data} canEdit={canEdit} />}
      </DataState>
      <ColumnsOverview companyId={companyId} canEdit={canEdit} />
      <ProductDefaultsBlock companyId={companyId} canEdit={canEdit} />
    </div>
  );
}
