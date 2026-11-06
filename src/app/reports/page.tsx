"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/DataState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportDownloads } from "@/features/reports/ReportDownloads";
import { SalesSnapshot } from "@/features/reports/SalesSnapshot";
import { StockNumbers } from "@/features/reports/StockNumbers";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useExpertMode } from "@/hooks/useExpertMode";

/** «Reportes»: your sales, how long your inventory lasts, and the files to download. */
export default function ReportsPage() {
  const companyId = useCompanyId();
  const [expert] = useExpertMode();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <PageHeader
        title="Reportes"
        description="Tus ventas, cuánto te dura el inventario y los archivos para descargar."
        action={
          <Link href="/forecasting" className="btn btn-ghost h-11 px-4 text-sm">
            Ir a Pronóstico
          </Link>
        }
      />
      {companyId ? (
        <>
          <SalesSnapshot companyId={companyId} />
          <StockNumbers companyId={companyId} expert={expert} />
          <ReportDownloads companyId={companyId} />
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
}
