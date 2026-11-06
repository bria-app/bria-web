/** Motor FTGM API client: scope preview, scoped runs, overview, tracking, quota, dashboard. */
import { apiClient } from "@/services/api/client";
import { queryString as qs } from "./query";
import type {
  FtgmQuota,
  ErpSummary,
  ForecastScope,
  FtgmFrequency,
  FtgmRun,
  ProductRunEntry,
  RunOverview,
  RunTracking,
  ScopePreview,
} from "@/types/forecasting";

const runs = (companyId: string) => `/companies/${companyId}/forecast-runs`;

export const ftgmApi = {
  previewScope: (companyId: string, body: { scope: ForecastScope; frequency?: FtgmFrequency; as_of?: string }) =>
    apiClient.post<ScopePreview>(`${runs(companyId)}/scope-preview`, body),
  createRun: (
    companyId: string,
    body: { scope: ForecastScope; horizon_days: number; frequency?: FtgmFrequency; as_of?: string },
  ) => apiClient.post<FtgmRun>(runs(companyId), { model_name: "FTGM", ...body }),
  /** isBacktest: true = only tests against the past, false = only real forecasts, omitted = all. */
  listRuns: (companyId: string, size = 50, isBacktest?: boolean) =>
    apiClient.get<FtgmRun[]>(
      `${runs(companyId)}${qs({ size, is_backtest: isBacktest === undefined ? undefined : String(isBacktest) })}`,
    ),
  getRun: (companyId: string, runId: string) => apiClient.get<FtgmRun>(`${runs(companyId)}/${runId}`),
  overview: (companyId: string, runId: string) => apiClient.get<RunOverview>(`${runs(companyId)}/${runId}/overview`),
  tracking: (companyId: string, runId: string) => apiClient.get<RunTracking>(`${runs(companyId)}/${runId}/tracking`),
  byProduct: (companyId: string, productId: string, limit = 5) =>
    apiClient.get<ProductRunEntry[]>(`${runs(companyId)}/by-product/${productId}?limit=${limit}`),
  quota: (companyId: string) => apiClient.get<FtgmQuota>(`${runs(companyId)}/quota`),
};

export const dashboardApi = {
  erpSummary: (companyId: string) => apiClient.get<ErpSummary>(`/companies/${companyId}/dashboard/erp-summary`),
};
